-- ============================================================
-- MIGRATION 026 — SCHOOLS DATA.GOUV.FR SYNC
-- Ajoute les colonnes nécessaires pour l'import officiel
-- Éducation Nationale, upsert idempotent et badge vérifié.
-- ============================================================

-- 1. Colonnes sync sur schools
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS external_id     TEXT,
  ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'datagouv',
  ADD COLUMN IF NOT EXISTS verified        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS synced_at       TIMESTAMPTZ;

-- 2. Index unique sur external_id pour upsert idempotent
--    (partiel : seulement quand external_id est renseigné)
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_external_id
  ON schools (external_id)
  WHERE external_id IS NOT NULL;

-- 3. Index BTREE pour filtrer par source et par statut vérifié
CREATE INDEX IF NOT EXISTS idx_schools_verified
  ON schools (verified) WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_schools_external_source
  ON schools (external_source) WHERE external_source IS NOT NULL;

-- 4. Étendre search_schools pour exposer verified et external_id
CREATE OR REPLACE FUNCTION search_schools(
  p_query     TEXT,
  p_city      TEXT    DEFAULT NULL,
  p_limit     INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_results    JSON;
BEGIN
  v_normalized := normalize_school_name(p_query);

  IF length(trim(p_query)) < 2 THEN
    RETURN json_build_object('success', true, 'data', '[]'::json);
  END IF;

  SELECT json_agg(row_to_json(r))
  INTO v_results
  FROM (
    SELECT
      s.id,
      s.name,
      s.normalized_name,
      s.type,
      s.address,
      s.city,
      s.postal_code,
      s.logo_url,
      s.is_active,
      s.verified,
      s.external_id,
      CASE
        WHEN s.normalized_name = v_normalized THEN 100
        WHEN s.normalized_name LIKE (v_normalized || '%') THEN 90
        ELSE ROUND((similarity(s.normalized_name, v_normalized) * 100)::numeric, 0)::integer
      END AS confidence
    FROM schools s
    WHERE
      s.is_active = true
      AND (
        s.normalized_name = v_normalized
        OR s.normalized_name LIKE (v_normalized || '%')
        OR similarity(s.normalized_name, v_normalized) > 0.2
        OR similarity(lower(s.city), lower(COALESCE(p_city, s.city))) > 0.5
      )
      AND (p_city IS NULL OR lower(s.city) ILIKE '%' || lower(p_city) || '%')
    ORDER BY
      s.verified DESC,
      confidence DESC,
      s.name ASC
    LIMIT p_limit
  ) r;

  RETURN json_build_object(
    'success', true,
    'data', COALESCE(v_results, '[]'::json)
  );
END;
$$;

-- 5. RPC upsert_school_from_datagouv — utilisée par la Edge Function
--    SECURITY DEFINER pour bypasser RLS (appelée avec service_role côté backend)
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

  -- Cherche d'abord par external_id exact
  SELECT id INTO v_school_id
  FROM schools
  WHERE external_id = p_external_id
  LIMIT 1;

  IF v_school_id IS NULL THEN
    -- Cherche par normalized_name + city pour éviter doublons
    SELECT id INTO v_school_id
    FROM schools
    WHERE normalized_name = v_normalized
      AND lower(city) = lower(p_city)
    LIMIT 1;
  END IF;

  IF v_school_id IS NOT NULL THEN
    -- Update les champs data.gouv seulement (ne pas écraser email/phone de l'admin)
    UPDATE schools SET
      external_id     = p_external_id,
      external_source = p_external_source,
      verified        = true,
      synced_at       = NOW(),
      -- Mise à jour adresse officielle uniquement si school n'a pas d'admin
      address         = CASE WHEN admin_user_id IS NULL THEN p_address ELSE address END,
      city            = CASE WHEN admin_user_id IS NULL THEN p_city    ELSE city    END,
      postal_code     = CASE WHEN admin_user_id IS NULL THEN p_postal_code ELSE postal_code END,
      updated_at      = NOW()
    WHERE id = v_school_id;
    v_action := 'updated';
  ELSE
    -- Insertion d'une nouvelle école officielle (sans admin_user_id)
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
      p_name,
      v_normalized,
      p_type,
      p_address,
      p_city,
      p_postal_code,
      -- Email placeholder unique pour satisfaire la contrainte NOT NULL/UNIQUE
      'sync+' || p_external_id || '@datagouv.fr',
      '',
      '', '', '',
      p_external_id,
      p_external_source,
      true,
      NOW(),
      true
    )
    RETURNING id INTO v_school_id;
    v_action := 'inserted';
  END IF;

  RETURN json_build_object('success', true, 'id', v_school_id, 'action', v_action);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Seul le service_role peut appeler cette fonction (pas l'app mobile)
REVOKE EXECUTE ON FUNCTION upsert_school_from_datagouv(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upsert_school_from_datagouv(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION upsert_school_from_datagouv(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO service_role;
