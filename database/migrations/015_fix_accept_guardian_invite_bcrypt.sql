-- Migration 015: Restore bcrypt PIN verification in accept_guardian_invite
-- Migration 013 overwrote 009's secure version with a plain-text comparison.
-- This restores the correct bcrypt crypt() check with brute-force lockout.

CREATE OR REPLACE FUNCTION public.accept_guardian_invite(
  p_invitation_token TEXT,
  p_access_code      TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_collector_id UUID := auth.uid();
  v_guardian     RECORD;
BEGIN
  SELECT * INTO v_guardian
  FROM public.guardians
  WHERE invitation_token = p_invitation_token
    AND collector_user_id IS NULL
    AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  -- Lockout check
  IF v_guardian.pin_locked_until IS NOT NULL AND v_guardian.pin_locked_until > NOW() THEN
    RETURN jsonb_build_object('error', 'pin_locked');
  END IF;

  -- PIN verification using bcrypt crypt()
  IF v_guardian.access_code_hash IS NOT NULL THEN
    IF p_access_code IS NULL OR p_access_code = '' THEN
      RETURN jsonb_build_object('error', 'access_code_required');
    END IF;

    IF crypt(p_access_code, v_guardian.access_code_hash) <> v_guardian.access_code_hash THEN
      UPDATE public.guardians
      SET pin_failed_attempts = pin_failed_attempts + 1,
          pin_locked_until    = CASE
            WHEN pin_failed_attempts + 1 >= 5
            THEN NOW() + INTERVAL '15 minutes'
            ELSE NULL
          END,
          updated_at = NOW()
      WHERE id = v_guardian.id;

      INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
      VALUES (
        v_collector_id, 'guardian_pin_failed', 'guardians', v_guardian.id,
        jsonb_build_object('attempt', v_guardian.pin_failed_attempts + 1)
      );

      RETURN jsonb_build_object('error', 'invalid_access_code');
    END IF;
  END IF;

  -- Success: reset counters, link collector, clear token
  UPDATE public.guardians
  SET collector_user_id   = v_collector_id,
      invitation_token    = NULL,
      pin_failed_attempts = 0,
      pin_locked_until    = NULL,
      updated_at          = NOW()
  WHERE id = v_guardian.id;

  -- Pre-populate user_profiles if the collector has no profile yet
  INSERT INTO public.user_profiles (user_id, first_name, last_name, role)
  VALUES (v_collector_id, v_guardian.first_name, v_guardian.last_name, 'collector')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_collector_id, 'guardian_invite_accepted', 'guardians', v_guardian.id,
    jsonb_build_object('parent_id', v_guardian.parent_id)
  );

  RETURN jsonb_build_object('guardian_id', v_guardian.id, 'parent_id', v_guardian.parent_id);
END;
$$;
