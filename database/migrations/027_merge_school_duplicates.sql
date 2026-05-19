-- ============================================================
-- MIGRATION 027 — FUSION DOUBLONS ÉCOLES + UPSERT ROBUSTE
-- Fusionne toutes les fiches en doublon (même nom normalisé +
-- même ville) en gardant la fiche avec admin_user_id comme
-- référence, et lui rattache external_id/verified de la fiche
-- data.gouv.fr. Corrige aussi upsert_school_from_datagouv pour
-- que ce cas ne se reproduise plus jamais.
-- ============================================================

-- ── 1. Fusion de tous les doublons existants ─────────────────
-- Pour chaque paire (normalized_name, city) qui a plusieurs
-- fiches, on garde celle qui a un admin (ou la plus ancienne),
-- on lui transfère external_id/verified, on repointe toutes
-- les FK (children, user_profiles, school_memberships,
-- pickup_validations, pickup_logs), puis on supprime le doublon.

DO $$
DECLARE
  r RECORD;
  v_keep    UUID;
  v_drop    UUID;
BEGIN
  -- Itérer sur chaque groupe de doublons
  FOR r IN
    SELECT
      normalized_name,
      lower(city) AS city_lower,
      -- Garder la fiche avec admin en priorité, sinon la plus ancienne
      (ARRAY_AGG(id ORDER BY
        CASE WHEN admin_user_id IS NOT NULL THEN 0 ELSE 1 END,
        created_at ASC
      ))[1] AS keep_id,
      ARRAY_AGG(id ORDER BY
        CASE WHEN admin_user_id IS NOT NULL THEN 0 ELSE 1 END,
        created_at ASC
      ) AS all_ids
    FROM schools
    GROUP BY normalized_name, lower(city)
    HAVING COUNT(*) > 1
  LOOP
    v_keep := r.keep_id;

    -- Traiter chaque doublon à supprimer
    FOR v_drop IN
      SELECT unnest(r.all_ids) AS id
    LOOP
      CONTINUE WHEN v_drop = v_keep;

      -- Transférer external_id et verified si la fiche gardée n'en a pas
      UPDATE schools SET
        external_id     = COALESCE(schools.external_id,     d.external_id),
        external_source = COALESCE(schools.external_source, d.external_source),
        verified        = schools.verified OR d.verified,
        synced_at       = GREATEST(schools.synced_at, d.synced_at),
        -- Transférer admin si la fiche gardée n'en a pas
        admin_user_id   = COALESCE(schools.admin_user_id,   d.admin_user_id),
        updated_at      = NOW()
      FROM schools d
      WHERE schools.id = v_keep
        AND d.id = v_drop;

      -- Repointer children
      UPDATE children
        SET school_id = v_keep
        WHERE school_id = v_drop;

      -- Repointer user_profiles
      UPDATE user_profiles
        SET school_id = v_keep
        WHERE school_id = v_drop;

      -- Repointer school_memberships (ignorer les conflits d'unicité)
      UPDATE school_memberships
        SET school_id = v_keep
        WHERE school_id = v_drop
          AND NOT EXISTS (
            SELECT 1 FROM school_memberships
            WHERE school_id = v_keep
              AND user_id = school_memberships.user_id
          );

      -- Supprimer les memberships orphelins qui auraient un conflit
      DELETE FROM school_memberships
        WHERE school_id = v_drop;

      -- Repointer pickup_validations
      UPDATE pickup_validations
        SET school_id = v_keep
        WHERE school_id = v_drop;

      -- Repointer pickup_logs
      UPDATE pickup_logs
        SET school_id = v_keep
        WHERE school_id = v_drop;

      -- Supprimer le doublon
      DELETE FROM schools WHERE id = v_drop;

    END LOOP;
  END LOOP;
END;
$$;

-- ── 2. S'assurer que le membership admin existe bien ─────────
-- Pour toute école avec admin_user_id mais sans membership
INSERT INTO school_memberships (school_id, user_id, role, is_active)
SELECT s.id, s.admin_user_id, 'school_admin', true
FROM schools s
WHERE s.admin_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM school_memberships sm
    WHERE sm.school_id = s.id
      AND sm.user_id   = s.admin_user_id
  )
ON CONFLICT (school_id, user_id) DO NOTHING;

-- ── 3. Correction upsert_school_from_datagouv ───────────────
-- Cherche aussi par similarity pour capturer les noms légèrement
-- différents (accents, casse, "Ecole" vs "École"), en priorisant
-- la fiche avec admin_user_id pour éviter tout nouveau doublon.
CREATE OR REPLACE FUNCTION upsert_school_from_datagouv(
  p_external_id     TEXT,
  p_name            TEXT,
  p_type            TEXT,
  p_address         TEXT,
  p_city            TEXT,
  p_postal_code     TEXT,
  p_external_source TEXT DEFAULT 'datagouv'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_school_id  UUID;
  v_action     TEXT;
BEGIN
  v_normalized := normalize_school_name(p_name);

  -- 1. Cherche par external_id exact (idempotent)
  SELECT id INTO v_school_id
  FROM schools
  WHERE external_id = p_external_id
  LIMIT 1;

  -- 2. Cherche par normalized_name + city (correspondance exacte)
  IF v_school_id IS NULL THEN
    SELECT id INTO v_school_id
    FROM schools
    WHERE normalized_name = v_normalized
      AND lower(city) = lower(p_city)
    ORDER BY
      CASE WHEN admin_user_id IS NOT NULL THEN 0 ELSE 1 END,
      created_at ASC
    LIMIT 1;
  END IF;

  -- 3. Cherche par similarity sur le nom + même ville
  --    (capture "Ecole" vs "École", accents, abréviations)
  IF v_school_id IS NULL THEN
    SELECT id INTO v_school_id
    FROM schools
    WHERE lower(city) = lower(p_city)
      AND similarity(normalized_name, v_normalized) > 0.6
      AND external_id IS NULL
    ORDER BY
      CASE WHEN admin_user_id IS NOT NULL THEN 0 ELSE 1 END,
      similarity(normalized_name, v_normalized) DESC,
      created_at ASC
    LIMIT 1;
  END IF;

  IF v_school_id IS NOT NULL THEN
    UPDATE schools SET
      external_id     = p_external_id,
      external_source = p_external_source,
      verified        = true,
      synced_at       = NOW(),
      address         = CASE WHEN admin_user_id IS NULL THEN p_address    ELSE address     END,
      city            = CASE WHEN admin_user_id IS NULL THEN p_city       ELSE city        END,
      postal_code     = CASE WHEN admin_user_id IS NULL THEN p_postal_code ELSE postal_code END,
      updated_at      = NOW()
    WHERE id = v_school_id;
    v_action := 'updated';
  ELSE
    INSERT INTO schools (
      id, name, normalized_name, type,
      address, city, postal_code,
      email, phone,
      manager_first_name, manager_last_name, manager_function,
      external_id, external_source,
      verified, synced_at,
      is_active
    ) VALUES (
      gen_random_uuid(),
      p_name, v_normalized, p_type,
      p_address, p_city, p_postal_code,
      'sync+' || p_external_id || '@datagouv.fr',
      '', '', '', '',
      p_external_id, p_external_source,
      true, NOW(), true
    )
    RETURNING id INTO v_school_id;
    v_action := 'inserted';
  END IF;

  -- S'assurer que le membership admin existe si la fiche a un admin
  INSERT INTO school_memberships (school_id, user_id, role, is_active)
  SELECT v_school_id, admin_user_id, 'school_admin', true
  FROM schools
  WHERE id = v_school_id AND admin_user_id IS NOT NULL
  ON CONFLICT (school_id, user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'id', v_school_id, 'action', v_action);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION upsert_school_from_datagouv(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upsert_school_from_datagouv(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION upsert_school_from_datagouv(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO service_role;
