-- Migration 018: Fix invite_guardian — restore bcrypt hashing lost in migration 013
-- Migration 013 overwrote 009's secure version with a plain-text store.
-- Any guardian created after 013 has access_code_hash = raw PIN digits → always invalid.
-- This migration:
--   1. Restores correct bcrypt hashing in invite_guardian
--   2. Deletes all guardians whose PIN was stored in plain text (not a bcrypt hash)
--      so they can be recreated cleanly by the parent

-- ─── 1. Restore invite_guardian with proper bcrypt hashing ───────────────────
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
  v_hashed      TEXT;
BEGIN
  -- Always hash PIN server-side — client sends plain PIN, never the hash
  IF p_access_code_hash IS NOT NULL AND p_access_code_hash <> '' THEN
    v_hashed := crypt(p_access_code_hash, gen_salt('bf', 10));
  ELSE
    v_hashed := NULL;
  END IF;

  INSERT INTO public.guardians (
    parent_id, child_id, first_name, last_name, phone, email, relationship,
    access_code_hash, invitation_token, invited_at, is_active
  ) VALUES (
    v_parent_id, p_child_id, p_first_name, p_last_name, p_phone,
    lower(trim(p_email)), p_relationship,
    v_hashed, v_token, NOW(), TRUE
  )
  RETURNING id INTO v_guardian_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_parent_id, 'guardian_invited', 'guardians', v_guardian_id,
    jsonb_build_object(
      'child_id',     p_child_id,
      'relationship', p_relationship,
      'has_pin',      v_hashed IS NOT NULL,
      'email',        p_email
    ));

  RETURN v_guardian_id;
END;
$$;

-- ─── 2. Delete guardians with corrupted plain-text PINs ───────────────────────
-- A valid bcrypt hash always starts with '$2a$' or '$2b$'.
-- Any access_code_hash that does NOT start with '$2' was stored in plain text
-- by the broken migration 013 and will never validate correctly.
DELETE FROM public.guardians
WHERE access_code_hash IS NOT NULL
  AND access_code_hash NOT LIKE '$2%';
