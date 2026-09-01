-- Verified against the deployed project: validate_qr_and_create_pickup answered
-- a call made with the anon key. CREATE FUNCTION grants EXECUTE to PUBLIC by
-- default and migration 024 never revoked it, so the grant to authenticated was
-- never a restriction. The function also trusted p_school_id and
-- p_scanner_user_id straight from the caller and never consulted auth.uid().
--
-- Anyone holding a QR token could therefore consume it, record the child as
-- collected and attribute the scan to any staff member, with no school
-- involved. A collector reads their own token through the policy added in
-- migration 029, so they could validate their own pickup and bypass the very
-- check this product exists to perform.
--
-- The scanner is now whoever is calling, and they must belong to the school
-- they claim to scan for. Everything else is migration 024 verbatim.
--
-- insert_notification is revoked in the same pass: it writes an arbitrary
-- title and body to any user id with no caller check, and reached its INSERT
-- under the anon key. Its real callers are triggers running as definer, which
-- REST grants do not affect.

CREATE OR REPLACE FUNCTION public.validate_qr_and_create_pickup(
  p_qr_token        TEXT,
  p_school_id       UUID,
  p_scanner_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $fn$
DECLARE
  v_caller      UUID := auth.uid();
  v_qr          RECORD;
  v_child       RECORD;
  v_guardian    RECORD;
  v_auth        RECORD;
  v_validation_id UUID;
  v_log_id        UUID;
  -- Timezone France
  v_tz          TEXT    := 'Europe/Paris';
  v_now_paris   TIMESTAMPTZ;
  v_dow         INTEGER; -- 1=Lun..7=Dim (ISODOW)
  v_time_paris  TIME;
  v_in_window   BOOLEAN := false;
  v_win         JSONB;
  v_win_start   TIME;
  v_win_end     TIME;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.school_memberships membership
    WHERE membership.school_id = p_school_id
      AND membership.user_id   = v_caller
      AND membership.is_active = TRUE
  ) AND NOT EXISTS (
    SELECT 1 FROM public.schools school
    WHERE school.id            = p_school_id
      AND school.admin_user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  v_now_paris  := NOW() AT TIME ZONE v_tz;
  v_dow        := EXTRACT(ISODOW FROM v_now_paris)::INTEGER;
  v_time_paris := v_now_paris::TIME;

  -- ── 1. Lock & fetch QR ────────────────────────────────────
  SELECT q.id, q.parent_id, q.child_id, q.guardian_id,
         q.expires_at, q.is_used, q.token
  INTO v_qr
  FROM qr_codes q
  WHERE q.token = p_qr_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'refusal_reason', 'QR invalide ou inexistant.');
  END IF;

  -- ── 2. Déjà utilisé ───────────────────────────────────────
  IF v_qr.is_used THEN
    RETURN json_build_object('success', false, 'refusal_reason', 'QR déjà utilisé.');
  END IF;

  -- ── 3. Expiré ─────────────────────────────────────────────
  IF v_qr.expires_at < NOW() THEN
    INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
    VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'refused', 'QR expiré.')
    RETURNING id INTO v_validation_id;
    RETURN json_build_object('success', false, 'refusal_reason', 'QR expiré.', 'validation_id', v_validation_id);
  END IF;

  -- ── 4. Enfant actif ───────────────────────────────────────
  SELECT c.id, c.first_name, c.last_name, c.photo_url, c.class_name, c.school_id, c.is_active
  INTO v_child
  FROM children c
  WHERE c.id = v_qr.child_id;

  IF NOT FOUND OR NOT v_child.is_active THEN
    RETURN json_build_object('success', false, 'refusal_reason', 'Enfant introuvable ou inactif.');
  END IF;

  -- ── 5. Bon établissement ──────────────────────────────────
  IF v_child.school_id IS DISTINCT FROM p_school_id THEN
    INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
    VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'refused', 'Établissement non correspondant.')
    RETURNING id INTO v_validation_id;
    RETURN json_build_object('success', false, 'refusal_reason', 'Établissement non correspondant.', 'validation_id', v_validation_id);
  END IF;

  -- ── 6. Guardian actif ─────────────────────────────────────
  IF v_qr.guardian_id IS NOT NULL THEN
    SELECT g.id, g.first_name, g.last_name, g.phone, g.photo_url, g.is_active, g.relationship,
           g.identity_status
    INTO v_guardian
    FROM guardians g
    WHERE g.id = v_qr.guardian_id;

    IF NOT FOUND OR NOT v_guardian.is_active THEN
      INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
      VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'refused', 'Collecteur désactivé ou introuvable.')
      RETURNING id INTO v_validation_id;
      RETURN json_build_object('success', false, 'refusal_reason', 'Collecteur désactivé ou introuvable.', 'validation_id', v_validation_id);
    END IF;

    -- ── 7. Vérification planning (jours + horaires) ──────────
    SELECT pa.monday, pa.tuesday, pa.wednesday, pa.thursday, pa.friday,
           pa.time_windows, pa.start_time, pa.end_time, pa.timezone, pa.is_active, pa.expires_at
    INTO v_auth
    FROM pickup_authorizations pa
    WHERE pa.guardian_id = v_qr.guardian_id
      AND pa.child_id    = v_qr.child_id
      AND pa.is_active   = true
    ORDER BY pa.updated_at DESC
    LIMIT 1;

    IF FOUND THEN
      -- Vérifier expiration autorisation
      IF v_auth.expires_at IS NOT NULL AND v_auth.expires_at < NOW() THEN
        INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
        VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'refused', 'Autorisation expirée.')
        RETURNING id INTO v_validation_id;
        RETURN json_build_object('success', false, 'refusal_reason', 'Autorisation expirée.', 'validation_id', v_validation_id);
      END IF;

      -- Utiliser la timezone stockée dans l'autorisation si disponible
      IF v_auth.timezone IS NOT NULL THEN
        v_now_paris  := NOW() AT TIME ZONE v_auth.timezone;
        v_dow        := EXTRACT(ISODOW FROM v_now_paris)::INTEGER;
        v_time_paris := v_now_paris::TIME;
      END IF;

      -- Vérifier jour autorisé (ISODOW: 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven)
      IF NOT (
        (v_dow = 1 AND v_auth.monday)   OR
        (v_dow = 2 AND v_auth.tuesday)  OR
        (v_dow = 3 AND v_auth.wednesday) OR
        (v_dow = 4 AND v_auth.thursday) OR
        (v_dow = 5 AND v_auth.friday)
      ) THEN
        INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
        VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'refused', 'Jour non autorisé pour cette récupération.')
        RETURNING id INTO v_validation_id;
        RETURN json_build_object('success', false, 'refusal_reason', 'Jour non autorisé pour cette récupération.', 'validation_id', v_validation_id);
      END IF;

      -- Vérifier plage horaire (time_windows JSONB ou start_time/end_time fallback)
      IF v_auth.time_windows IS NOT NULL AND jsonb_array_length(v_auth.time_windows) > 0 THEN
        FOR v_win IN SELECT * FROM jsonb_array_elements(v_auth.time_windows)
        LOOP
          v_win_start := (v_win->>'start')::TIME;
          v_win_end   := (v_win->>'end')::TIME;
          IF v_time_paris >= v_win_start AND v_time_paris <= v_win_end THEN
            v_in_window := true;
            EXIT;
          END IF;
        END LOOP;
      ELSE
        -- Fallback colonnes legacy
        v_win_start := COALESCE(v_auth.start_time, '00:00:00'::TIME);
        v_win_end   := COALESCE(v_auth.end_time,   '23:59:59'::TIME);
        IF v_time_paris >= v_win_start AND v_time_paris <= v_win_end THEN
          v_in_window := true;
        END IF;
      END IF;

      IF NOT v_in_window THEN
        INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
        VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'refused',
                'Hors du créneau de récupération autorisé.')
        RETURNING id INTO v_validation_id;
        RETURN json_build_object('success', false, 'refusal_reason', 'Hors du créneau de récupération autorisé.', 'validation_id', v_validation_id);
      END IF;
    END IF;
    -- Si aucune pickup_authorization trouvée → pas de contrainte horaire (comportement précédent conservé)
  END IF;

  -- ── 8. Marquer QR utilisé ─────────────────────────────────
  UPDATE qr_codes SET is_used = true, used_at = NOW(), updated_at = NOW()
  WHERE id = v_qr.id;

  -- ── 9. Créer la validation ────────────────────────────────
  INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status)
  VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, 'validated')
  RETURNING id INTO v_validation_id;

  -- ── 10. Créer le log ──────────────────────────────────────
  INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status)
  VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, v_caller, p_school_id, 'completed')
  RETURNING id INTO v_log_id;

  -- ── 11. Mettre à jour next_pickup_at dans l'autorisation ──
  IF v_qr.guardian_id IS NOT NULL THEN
    UPDATE pickup_authorizations pa
    SET next_pickup_at = compute_next_pickup_at(
          pa.monday, pa.tuesday, pa.wednesday, pa.thursday, pa.friday,
          pa.time_windows, pa.start_time, pa.timezone
        ),
        updated_at = NOW()
    WHERE pa.guardian_id = v_qr.guardian_id
      AND pa.child_id    = v_qr.child_id
      AND pa.is_active   = true;
  END IF;

  RETURN json_build_object(
    'success',       true,
    'validation_id', v_validation_id,
    'log_id',        v_log_id,
    'child', json_build_object(
      'id',         v_child.id,
      'first_name', v_child.first_name,
      'last_name',  v_child.last_name,
      'photo_url',  v_child.photo_url,
      'class_name', v_child.class_name
    ),
    'guardian', CASE WHEN v_qr.guardian_id IS NOT NULL THEN
      json_build_object(
        'id',              v_guardian.id,
        'first_name',      v_guardian.first_name,
        'last_name',       v_guardian.last_name,
        'phone',           v_guardian.phone,
        'photo_url',       v_guardian.photo_url,
        'relationship',    v_guardian.relationship,
        'identity_status', v_guardian.identity_status
      )
    ELSE NULL END
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.validate_qr_and_create_pickup(TEXT, UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_qr_and_create_pickup(TEXT, UUID, UUID)
  TO authenticated;

REVOKE ALL ON FUNCTION public.insert_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
