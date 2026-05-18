-- Migration 016: Collector PIN-based recurring login
-- After the first magic-link invitation, the collector logs in with only their
-- PIN. This migration adds:
--   1. access_code_version column — incremented when parent changes the PIN,
--      so old cached sessions are invalidated.
--   2. resolve_collector_pin RPC — verifies the PIN for an already-linked
--      collector and returns their profile + children. Used at every app open.

-- ─── 1. access_code_version column ───────────────────────────────────────────
ALTER TABLE public.guardians
  ADD COLUMN IF NOT EXISTS access_code_version INTEGER NOT NULL DEFAULT 1;

-- ─── 2. RPC: resolve_collector_pin ───────────────────────────────────────────
-- Called by the collector app at every launch to verify their PIN.
-- Returns the collector profile and linked children if the PIN is valid and the
-- guardian record is still active. Returns an error payload otherwise.
CREATE OR REPLACE FUNCTION public.resolve_collector_pin(
  p_pin TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_collector_id UUID := auth.uid();
  v_guardian     RECORD;
  v_child        RECORD;
  v_profile      RECORD;
BEGIN
  -- Find an active, linked guardian record for this collector that requires a PIN
  SELECT g.*
  INTO v_guardian
  FROM public.guardians g
  WHERE g.collector_user_id = v_collector_id
    AND g.is_active = TRUE
    AND g.access_code_hash IS NOT NULL
  ORDER BY g.updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'no_active_guardian');
  END IF;

  -- Lockout check
  IF v_guardian.pin_locked_until IS NOT NULL AND v_guardian.pin_locked_until > NOW() THEN
    RETURN jsonb_build_object('error', 'pin_locked');
  END IF;

  -- bcrypt verification
  IF crypt(p_pin, v_guardian.access_code_hash) <> v_guardian.access_code_hash THEN
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
      v_collector_id, 'collector_pin_failed', 'guardians', v_guardian.id,
      jsonb_build_object('attempt', v_guardian.pin_failed_attempts + 1)
    );

    RETURN jsonb_build_object('error', 'invalid_pin');
  END IF;

  -- PIN correct — reset failed attempts
  UPDATE public.guardians
  SET pin_failed_attempts = 0,
      pin_locked_until    = NULL,
      updated_at          = NOW()
  WHERE id = v_guardian.id;

  -- Fetch collector profile
  SELECT id, first_name, last_name, phone, avatar_url, role
  INTO v_profile
  FROM public.user_profiles
  WHERE user_id = v_collector_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_collector_id, 'collector_pin_verified', 'guardians', v_guardian.id,
    jsonb_build_object('access_code_version', v_guardian.access_code_version)
  );

  -- Return minimal payload: role + access_code_version (used by client to
  -- detect PIN changes) + first child name for UX greeting
  SELECT c.first_name, c.last_name
  INTO v_child
  FROM public.children c
  WHERE c.id = v_guardian.child_id;

  RETURN jsonb_build_object(
    'role',                 'collector',
    'access_code_version',  v_guardian.access_code_version,
    'guardian_id',          v_guardian.id,
    'first_name',           COALESCE(v_profile.first_name, v_guardian.first_name),
    'last_name',            COALESCE(v_profile.last_name,  v_guardian.last_name),
    'child_first_name',     v_child.first_name
  );
END;
$$;

-- ─── 3. update_guardian_pin: increment access_code_version on PIN change ──────
-- Replaces the version from migration 011 with version increment so the client
-- can detect that its cached version is stale and force re-verification.
CREATE OR REPLACE FUNCTION public.update_guardian_pin(
  p_guardian_id  UUID,
  p_access_code  TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_hashed    TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.guardians
    WHERE id = p_guardian_id AND parent_id = v_parent_id
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  IF p_access_code IS NOT NULL AND p_access_code <> '' THEN
    v_hashed := crypt(p_access_code, gen_salt('bf', 10));
  ELSE
    v_hashed := NULL;
  END IF;

  UPDATE public.guardians
  SET access_code_hash    = v_hashed,
      -- Increment version so the collector's SecureStore cache is invalidated
      access_code_version = access_code_version + 1,
      pin_failed_attempts = 0,
      pin_locked_until    = NULL,
      updated_at          = NOW()
  WHERE id = p_guardian_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_parent_id, 'guardian_pin_updated', 'guardians', p_guardian_id,
    jsonb_build_object('has_pin', v_hashed IS NOT NULL)
  );
END;
$$;
