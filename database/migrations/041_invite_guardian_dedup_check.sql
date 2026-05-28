-- ============================================================
-- MIGRATION 041 — invite_guardian: explicit dedup check
--
-- Adds a check at the top of invite_guardian so the caller
-- gets a clear error code instead of a raw constraint violation
-- when trying to invite the same email twice for the same child.
-- ============================================================

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
  v_email_norm  TEXT := lower(trim(p_email));
BEGIN
  -- Guard: duplicate active invitation for this child+email
  IF v_email_norm IS NOT NULL AND v_email_norm <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.guardians
      WHERE child_id = p_child_id
        AND lower(trim(email)) = v_email_norm
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'duplicate_guardian_email';
    END IF;
  END IF;

  INSERT INTO public.guardians (
    parent_id, child_id, first_name, last_name, phone, email, relationship,
    access_code_hash, invitation_token, invited_at, is_active
  ) VALUES (
    v_parent_id, p_child_id, p_first_name, p_last_name, p_phone,
    NULLIF(v_email_norm, ''), p_relationship,
    p_access_code_hash, v_token, NOW(), TRUE
  )
  RETURNING id INTO v_guardian_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_parent_id, 'guardian_invited', 'guardians', v_guardian_id,
    jsonb_build_object('child_id', p_child_id, 'relationship', p_relationship, 'email', p_email));

  RETURN v_guardian_id;
END;
$$;
