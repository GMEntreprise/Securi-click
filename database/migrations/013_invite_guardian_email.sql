-- Migration 013: Fix invite_guardian to store email, and sync guardian name to user_profiles on acceptance

-- ─── 1. Add p_email to invite_guardian ────────────────────────────────────────
-- The previous version had no p_email param, so guardians.email was always NULL,
-- which broke get_pending_invites_by_email (queries WHERE g.email = p_email).
CREATE OR REPLACE FUNCTION public.invite_guardian(
  p_child_id          UUID,
  p_first_name        TEXT,
  p_last_name         TEXT,
  p_phone             TEXT DEFAULT NULL,
  p_relationship      TEXT DEFAULT '',
  p_access_code_hash  TEXT DEFAULT NULL,
  p_email             TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id   UUID := auth.uid();
  v_token       TEXT := gen_random_uuid()::TEXT;
  v_guardian_id UUID;
BEGIN
  INSERT INTO public.guardians (
    parent_id, child_id, first_name, last_name, phone, email, relationship,
    access_code_hash, invitation_token, invited_at, is_active
  ) VALUES (
    v_parent_id, p_child_id, p_first_name, p_last_name, p_phone, lower(trim(p_email)), p_relationship,
    p_access_code_hash, v_token, NOW(), TRUE
  )
  RETURNING id INTO v_guardian_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_parent_id, 'guardian_invited', 'guardians', v_guardian_id,
    jsonb_build_object('child_id', p_child_id, 'relationship', p_relationship, 'email', p_email));

  RETURN v_guardian_id;
END;
$$;

-- ─── 2. Update accept_guardian_invite to pre-populate user_profiles ───────────
-- When a collector accepts an invite, we upsert their user_profiles row using
-- the guardian's first_name/last_name if no profile exists yet.
-- This ensures the collector sees their correct name on first login.
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

  IF v_guardian.access_code_hash IS NOT NULL THEN
    IF p_access_code IS NULL THEN
      RETURN jsonb_build_object('error', 'access_code_required');
    END IF;
    IF v_guardian.access_code_hash <> p_access_code THEN
      RETURN jsonb_build_object('error', 'invalid_access_code');
    END IF;
  END IF;

  UPDATE public.guardians
  SET collector_user_id = v_collector_id,
      invitation_token  = NULL,
      updated_at        = NOW()
  WHERE id = v_guardian.id;

  -- Upsert user_profiles: insert with guardian name if no row exists yet,
  -- otherwise leave existing name intact (collector may have already set it).
  INSERT INTO public.user_profiles (user_id, first_name, last_name, role)
  VALUES (v_collector_id, v_guardian.first_name, v_guardian.last_name, 'collector')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_collector_id, 'guardian_invite_accepted', 'guardians', v_guardian.id,
    jsonb_build_object('parent_id', v_guardian.parent_id));

  RETURN jsonb_build_object('guardian_id', v_guardian.id, 'parent_id', v_guardian.parent_id);
END;
$$;
