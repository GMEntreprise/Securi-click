-- Migration 044 narrowed the sign-up trigger to parent and school_admin, so an
-- account created by the collector invitation e-mail now lands with
-- role = 'parent'. accept_guardian_invite then refused to correct it, because
-- its INSERT used ON CONFLICT DO NOTHING and the profile row already existed.
-- Every collector invited since 044 therefore reaches the parent dashboard.
--
-- The role is now upgraded on acceptance, which is the one moment the server
-- has proved the person holds the invitation token and its PIN. The upgrade is
-- deliberately narrow: an account that already acts as a parent keeps its role,
-- so a parent accepting a guardian invitation for another family is never
-- locked out of their own children.
--
-- Everything else is migration 015 verbatim.

CREATE OR REPLACE FUNCTION public.accept_guardian_invite(
  p_invitation_token TEXT,
  p_access_code      TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $fn$
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

  IF v_guardian.pin_locked_until IS NOT NULL AND v_guardian.pin_locked_until > NOW() THEN
    RETURN jsonb_build_object('error', 'pin_locked');
  END IF;

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

  UPDATE public.guardians
  SET collector_user_id   = v_collector_id,
      invitation_token    = NULL,
      pin_failed_attempts = 0,
      pin_locked_until    = NULL,
      updated_at          = NOW()
  WHERE id = v_guardian.id;

  INSERT INTO public.user_profiles (user_id, first_name, last_name, role)
  VALUES (v_collector_id, v_guardian.first_name, v_guardian.last_name, 'collector')
  ON CONFLICT (user_id) DO UPDATE
  SET role       = 'collector',
      updated_at = NOW()
  WHERE public.user_profiles.role = 'parent'
    AND NOT EXISTS (
      SELECT 1 FROM public.children child
      WHERE child.parent_id = EXCLUDED.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.guardians owned
      WHERE owned.parent_id = EXCLUDED.user_id
    );

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_collector_id, 'guardian_invite_accepted', 'guardians', v_guardian.id,
    jsonb_build_object('parent_id', v_guardian.parent_id)
  );

  RETURN jsonb_build_object('guardian_id', v_guardian.id, 'parent_id', v_guardian.parent_id);
END;
$fn$;

UPDATE public.user_profiles profile
SET role = 'collector', updated_at = NOW()
WHERE profile.role = 'parent'
  AND EXISTS (
    SELECT 1 FROM public.guardians linked
    WHERE linked.collector_user_id = profile.user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.children child WHERE child.parent_id = profile.user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.guardians owned WHERE owned.parent_id = profile.user_id
  );
