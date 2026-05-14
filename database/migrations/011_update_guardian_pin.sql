-- Migration 011: RPC to update/clear guardian PIN server-side
-- Called by parent when editing an existing guardian.
-- Rehashes with bcrypt cost=10 or clears the hash.
-- Resets brute-force counters on PIN change.

CREATE OR REPLACE FUNCTION public.update_guardian_pin(
  p_guardian_id  UUID,
  p_access_code  TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_hashed    TEXT;
BEGIN
  -- Caller must own this guardian row
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
