-- ============================================================
-- MIGRATION 033 — Feed pickup_history from school validations
--
-- Problème : validate_qr_and_create_pickup insère dans pickup_logs
-- mais jamais dans pickup_history → l'historique parent reste vide
-- après chaque scan école.
--
-- Fix : chaque INSERT dans pickup_logs est accompagné d'un INSERT
-- dans pickup_history (même données, même status mappé).
-- Mapping status : validated → completed | refused → denied
-- ============================================================

CREATE OR REPLACE FUNCTION validate_qr_and_create_pickup(
  p_qr_token        TEXT,
  p_school_id       UUID,
  p_scanner_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_qr            RECORD;
  v_child         RECORD;
  v_guardian      RECORD;
  v_school        RECORD;
  v_auth          RECORD;
  v_validation_id UUID;
  v_log_id        UUID;
  v_history_id    UUID;
  v_tz            TEXT    := 'Europe/Paris';
  v_now_paris     TIMESTAMPTZ;
  v_dow           INTEGER;
  v_time_paris    TIME;
  v_in_window     BOOLEAN := false;
  v_win           JSONB;
  v_win_start     TIME;
  v_win_end       TIME;
  v_school_name   TEXT;
  v_child_name    TEXT;
  v_collector_name TEXT;

BEGIN
  v_now_paris  := NOW() AT TIME ZONE v_tz;
  v_dow        := EXTRACT(ISODOW FROM v_now_paris)::INTEGER;
  v_time_paris := v_now_paris::TIME;

  SELECT s.name INTO v_school_name FROM schools s WHERE s.id = p_school_id;
  v_school_name := COALESCE(v_school_name, 'l''établissement');

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
    VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'QR expiré.')
    RETURNING id INTO v_validation_id;

    INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status, denial_reason)
    VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'denied', 'QR expiré.');

    INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, denial_reason, scanned_at)
    VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'denied', 'QR expiré.', NOW())
    RETURNING id INTO v_history_id;

    SELECT c.first_name || ' ' || c.last_name INTO v_child_name FROM children c WHERE c.id = v_qr.child_id;
    PERFORM insert_notification(
      v_qr.parent_id, 'parent', 'pickup_refused',
      'Accès refusé — QR expiré',
      'Le QR code de ' || COALESCE(v_child_name, 'votre enfant') || ' a expiré lors d''une tentative de récupération à ' || v_school_name || '.',
      jsonb_build_object('child_id', v_qr.child_id, 'school_name', v_school_name, 'refusal_reason', 'QR expiré.'),
      'pickup_refused_' || v_validation_id::TEXT,
      'school_admin'
    );

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

  v_child_name := v_child.first_name || ' ' || v_child.last_name;

  -- ── 5. Bon établissement ──────────────────────────────────
  IF v_child.school_id IS DISTINCT FROM p_school_id THEN
    INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
    VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Établissement non correspondant.')
    RETURNING id INTO v_validation_id;

    INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status, denial_reason)
    VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'denied', 'Établissement non correspondant.');

    INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, denial_reason, scanned_at)
    VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'denied', 'Établissement non correspondant.', NOW())
    RETURNING id INTO v_history_id;

    PERFORM insert_notification(
      v_qr.parent_id, 'parent', 'pickup_refused',
      'Accès refusé — mauvais établissement',
      'Une tentative de récupération de ' || v_child_name || ' a eu lieu dans un établissement non autorisé.',
      jsonb_build_object('child_id', v_qr.child_id, 'child_name', v_child_name, 'school_name', v_school_name, 'refusal_reason', 'Établissement non correspondant.'),
      'pickup_refused_' || v_validation_id::TEXT,
      'school_admin'
    );

    RETURN json_build_object('success', false, 'refusal_reason', 'Établissement non correspondant.', 'validation_id', v_validation_id);
  END IF;

  -- ── 6. Guardian actif ─────────────────────────────────────
  IF v_qr.guardian_id IS NOT NULL THEN
    SELECT g.id, g.first_name, g.last_name, g.phone, g.photo_url, g.is_active, g.relationship,
           g.identity_status
    INTO v_guardian
    FROM guardians g
    WHERE g.id = v_qr.guardian_id;

    v_collector_name := COALESCE(v_guardian.first_name || ' ' || v_guardian.last_name, 'Collecteur inconnu');

    IF NOT FOUND OR NOT v_guardian.is_active THEN
      INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
      VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Collecteur désactivé ou introuvable.')
      RETURNING id INTO v_validation_id;

      INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status, denial_reason)
      VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'denied', 'Collecteur désactivé ou introuvable.');

      INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, denial_reason, scanned_at)
      VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'denied', 'Collecteur désactivé ou introuvable.', NOW())
      RETURNING id INTO v_history_id;

      PERFORM insert_notification(
        v_qr.parent_id, 'parent', 'pickup_refused',
        'Accès refusé — collecteur désactivé',
        v_collector_name || ' a tenté de récupérer ' || v_child_name || ' à ' || v_school_name || ' mais son accès est désactivé.',
        jsonb_build_object('child_id', v_qr.child_id, 'child_name', v_child_name, 'collector_name', v_collector_name, 'school_name', v_school_name, 'refusal_reason', 'Collecteur désactivé.'),
        'pickup_refused_' || v_validation_id::TEXT,
        'school_admin'
      );

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
      IF v_auth.expires_at IS NOT NULL AND v_auth.expires_at < NOW() THEN
        INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
        VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Autorisation expirée.')
        RETURNING id INTO v_validation_id;

        INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status, denial_reason)
        VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'denied', 'Autorisation expirée.');

        INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, denial_reason, scanned_at)
        VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'denied', 'Autorisation expirée.', NOW())
        RETURNING id INTO v_history_id;

        PERFORM insert_notification(
          v_qr.parent_id, 'parent', 'pickup_refused',
          'Accès refusé — autorisation expirée',
          'L''autorisation de ' || v_collector_name || ' pour ' || v_child_name || ' a expiré.',
          jsonb_build_object('child_id', v_qr.child_id, 'child_name', v_child_name, 'collector_name', v_collector_name, 'school_name', v_school_name, 'refusal_reason', 'Autorisation expirée.'),
          'pickup_refused_' || v_validation_id::TEXT,
          'school_admin'
        );

        RETURN json_build_object('success', false, 'refusal_reason', 'Autorisation expirée.', 'validation_id', v_validation_id);
      END IF;

      IF v_auth.timezone IS NOT NULL THEN
        v_now_paris  := NOW() AT TIME ZONE v_auth.timezone;
        v_dow        := EXTRACT(ISODOW FROM v_now_paris)::INTEGER;
        v_time_paris := v_now_paris::TIME;
      END IF;

      IF NOT (
        (v_dow = 1 AND v_auth.monday)   OR
        (v_dow = 2 AND v_auth.tuesday)  OR
        (v_dow = 3 AND v_auth.wednesday) OR
        (v_dow = 4 AND v_auth.thursday) OR
        (v_dow = 5 AND v_auth.friday)
      ) THEN
        INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
        VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Jour non autorisé pour cette récupération.')
        RETURNING id INTO v_validation_id;

        INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status, denial_reason)
        VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'denied', 'Jour non autorisé pour cette récupération.');

        INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, denial_reason, scanned_at)
        VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'denied', 'Jour non autorisé pour cette récupération.', NOW())
        RETURNING id INTO v_history_id;

        PERFORM insert_notification(
          v_qr.parent_id, 'parent', 'pickup_refused',
          'Accès refusé — jour non autorisé',
          v_collector_name || ' a tenté de récupérer ' || v_child_name || ' un jour non autorisé à ' || v_school_name || '.',
          jsonb_build_object('child_id', v_qr.child_id, 'child_name', v_child_name, 'collector_name', v_collector_name, 'school_name', v_school_name, 'refusal_reason', 'Jour non autorisé.'),
          'pickup_refused_' || v_validation_id::TEXT,
          'school_admin'
        );

        RETURN json_build_object('success', false, 'refusal_reason', 'Jour non autorisé pour cette récupération.', 'validation_id', v_validation_id);
      END IF;

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
        v_win_start := COALESCE(v_auth.start_time, '00:00:00'::TIME);
        v_win_end   := COALESCE(v_auth.end_time,   '23:59:59'::TIME);
        IF v_time_paris >= v_win_start AND v_time_paris <= v_win_end THEN
          v_in_window := true;
        END IF;
      END IF;

      IF NOT v_in_window THEN
        INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
        VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Hors du créneau de récupération autorisé.')
        RETURNING id INTO v_validation_id;

        INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status, denial_reason)
        VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'denied', 'Hors du créneau de récupération autorisé.');

        INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, denial_reason, scanned_at)
        VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'denied', 'Hors du créneau de récupération autorisé.', NOW())
        RETURNING id INTO v_history_id;

        PERFORM insert_notification(
          v_qr.parent_id, 'parent', 'pickup_refused',
          'Accès refusé — hors créneau',
          v_collector_name || ' a tenté de récupérer ' || v_child_name || ' en dehors du créneau autorisé à ' || v_school_name || '.',
          jsonb_build_object('child_id', v_qr.child_id, 'child_name', v_child_name, 'collector_name', v_collector_name, 'school_name', v_school_name, 'refusal_reason', 'Hors créneau.'),
          'pickup_refused_' || v_validation_id::TEXT,
          'school_admin'
        );

        RETURN json_build_object('success', false, 'refusal_reason', 'Hors du créneau de récupération autorisé.', 'validation_id', v_validation_id);
      END IF;
    END IF;
  END IF;

  -- ── 8. Marquer QR utilisé ─────────────────────────────────
  UPDATE qr_codes SET is_used = true, used_at = NOW(), updated_at = NOW()
  WHERE id = v_qr.id;

  -- ── 9. Créer la validation ────────────────────────────────
  INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status)
  VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'validated')
  RETURNING id INTO v_validation_id;

  -- ── 10. Créer le log (succès) ─────────────────────────────
  INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status)
  VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'completed')
  RETURNING id INTO v_log_id;

  -- ── 10b. Créer l'entrée historique parent (succès) ────────
  INSERT INTO pickup_history (parent_id, child_id, collector_id, school_id, staff_id, qr_jti, status, scanned_at)
  VALUES (v_qr.parent_id, v_qr.child_id, v_qr.guardian_id, p_school_id, p_scanner_user_id, v_qr.token, 'completed', NOW())
  RETURNING id INTO v_history_id;

  -- ── 11. Notifier le parent du succès ──────────────────────
  v_child_name     := COALESCE(v_child_name, v_child.first_name || ' ' || v_child.last_name);
  v_collector_name := CASE
    WHEN v_guardian.id IS NOT NULL THEN v_guardian.first_name || ' ' || v_guardian.last_name
    ELSE NULL
  END;

  PERFORM insert_notification(
    v_qr.parent_id, 'parent', 'child_picked_up',
    v_child_name || ' a été récupéré·e',
    COALESCE(v_collector_name, 'Votre enfant') || ' a quitté ' || v_school_name || '.',
    jsonb_build_object('child_id', v_qr.child_id, 'child_name', v_child_name, 'collector_name', v_collector_name, 'school_name', v_school_name, 'log_id', v_log_id),
    'pickup_success_' || v_log_id::TEXT,
    'school_admin'
  );

  -- ── 12. Mettre à jour next_pickup_at ─────────────────────
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
    'guardian', CASE WHEN v_qr.guardian_id IS NOT NULL AND v_guardian.id IS NOT NULL THEN
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
$$;

GRANT EXECUTE ON FUNCTION validate_qr_and_create_pickup(TEXT, UUID, UUID) TO authenticated;
