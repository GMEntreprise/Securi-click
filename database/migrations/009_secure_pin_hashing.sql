-- Migration 009: Secure PIN hashing with pgcrypto bcrypt
-- Replaces plain-text equality check with crypt() / gen_salt('bf')

-- ─── 1. Enable pgcrypto (no-op if already enabled) ───────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 2. Add failed_attempts + locked_until to guardians ─────────────────────
ALTER TABLE public.guardians
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until    TIMESTAMPTZ;

-- ─── 3. RPC: invite_guardian — hash PIN server-side with bcrypt ──────────────
CREATE OR REPLACE FUNCTION public.invite_guardian(
  p_child_id          UUID,
  p_first_name        TEXT,
  p_last_name         TEXT,
  p_phone             TEXT,
  p_relationship      TEXT,
  p_access_code_hash  TEXT DEFAULT NULL,
  p_email             TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id   UUID := auth.uid();
  v_token       TEXT := gen_random_uuid()::TEXT;
  v_guardian_id UUID;
  v_hashed      TEXT;
BEGIN
  -- Hash PIN server-side with bcrypt cost=10; never store plain text
  IF p_access_code_hash IS NOT NULL AND p_access_code_hash <> '' THEN
    v_hashed := crypt(p_access_code_hash, gen_salt('bf', 10));
  ELSE
    v_hashed := NULL;
  END IF;

  INSERT INTO public.guardians (
    parent_id, child_id, first_name, last_name, phone, email, relationship,
    access_code_hash, invitation_token, invited_at, is_active
  ) VALUES (
    v_parent_id, p_child_id, p_first_name, p_last_name, p_phone, p_email, p_relationship,
    v_hashed, v_token, NOW(), TRUE
  )
  RETURNING id INTO v_guardian_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_parent_id, 'guardian_invited', 'guardians', v_guardian_id,
    jsonb_build_object(
      'child_id', p_child_id,
      'relationship', p_relationship,
      'has_pin', v_hashed IS NOT NULL
    )
  );

  RETURN v_guardian_id;
END;
$$;

-- ─── 4. RPC: accept_guardian_invite — verify PIN with crypt() ────────────────
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
      -- Increment failed attempts; lock after 5
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

  -- Success — reset failed attempts, link collector
  UPDATE public.guardians
  SET collector_user_id   = v_collector_id,
      invitation_token    = NULL,
      pin_failed_attempts = 0,
      pin_locked_until    = NULL,
      updated_at          = NOW()
  WHERE id = v_guardian.id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_collector_id, 'guardian_invite_accepted', 'guardians', v_guardian.id,
    jsonb_build_object('parent_id', v_guardian.parent_id)
  );

  RETURN jsonb_build_object('guardian_id', v_guardian.id, 'parent_id', v_guardian.parent_id);
END;
$$;
