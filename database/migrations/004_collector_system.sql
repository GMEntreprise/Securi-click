-- Migration 004: collector system — invitations, identities, permissions, audit

-- ─── 1. Extend invited_collectors ──────────────────────────────────────────
ALTER TABLE public.invited_collectors
  ADD COLUMN IF NOT EXISTS access_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS collector_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS relationship      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notes             TEXT;

-- ─── 2. collector_identities ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collector_identities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type       TEXT NOT NULL CHECK (document_type IN ('id_card', 'passport', 'driving_license')),
  front_path          TEXT,
  back_path           TEXT,
  selfie_path         TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'verified', 'refused', 'expired')),
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  refusal_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collector_identities_collector
  ON public.collector_identities (collector_user_id);
CREATE INDEX IF NOT EXISTS idx_collector_identities_parent
  ON public.collector_identities (parent_id);
CREATE INDEX IF NOT EXISTS idx_collector_identities_status
  ON public.collector_identities (verification_status);

-- ─── 3. audit_logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  table_name  TEXT,
  row_id      UUID,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_row        ON public.audit_logs (row_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ─── 4. Extend guardians — add access_code_hash ──────────────────────────────
-- The parent sets an optional PIN when adding a guardian/collector.
-- Stored as bcrypt hash server-side (or as plain for MVP, hashed client never).
ALTER TABLE public.guardians
  ADD COLUMN IF NOT EXISTS access_code_hash       TEXT,
  ADD COLUMN IF NOT EXISTS collector_user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS identity_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identity_status         TEXT DEFAULT 'none'
                              CHECK (identity_status IN ('none', 'pending', 'verified', 'refused', 'expired')),
  ADD COLUMN IF NOT EXISTS invited_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_token        TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_guardians_collector_user
  ON public.guardians (collector_user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_invitation_token
  ON public.guardians (invitation_token) WHERE invitation_token IS NOT NULL;

-- ─── 5. RLS — collector_identities ──────────────────────────────────────────
ALTER TABLE public.collector_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collector_read_own_identity" ON public.collector_identities
  FOR SELECT USING (auth.uid() = collector_user_id);

CREATE POLICY "collector_insert_own_identity" ON public.collector_identities
  FOR INSERT WITH CHECK (auth.uid() = collector_user_id);

CREATE POLICY "collector_update_own_identity" ON public.collector_identities
  FOR UPDATE USING (auth.uid() = collector_user_id)
  WITH CHECK (auth.uid() = collector_user_id);

CREATE POLICY "parent_read_linked_identities" ON public.collector_identities
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "parent_update_verification" ON public.collector_identities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'parent'
    ) AND auth.uid() = parent_id
  );

-- ─── 6. RLS — audit_logs (append-only; no client delete/update) ─────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_audit" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_audit_log" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── 7. RLS — guardians extended (collector can read own) ───────────────────
-- Add policy: collector can read guardians where collector_user_id = auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'guardians' AND policyname = 'collector_read_own_guardian'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "collector_read_own_guardian" ON public.guardians
        FOR SELECT USING (auth.uid() = collector_user_id)
    $p$;
  END IF;
END$$;

-- ─── 8. RPC: invite_guardian ─────────────────────────────────────────────────
-- Called by parent to create guardian + invitation token + optional access code hash
CREATE OR REPLACE FUNCTION public.invite_guardian(
  p_child_id          UUID,
  p_first_name        TEXT,
  p_last_name         TEXT,
  p_phone             TEXT,
  p_relationship      TEXT,
  p_access_code_hash  TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id   UUID := auth.uid();
  v_token       TEXT := gen_random_uuid()::TEXT;
  v_guardian_id UUID;
BEGIN
  INSERT INTO public.guardians (
    parent_id, child_id, first_name, last_name, phone, relationship,
    access_code_hash, invitation_token, invited_at, is_active
  ) VALUES (
    v_parent_id, p_child_id, p_first_name, p_last_name, p_phone, p_relationship,
    p_access_code_hash, v_token, NOW(), TRUE
  )
  RETURNING id INTO v_guardian_id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_parent_id, 'guardian_invited', 'guardians', v_guardian_id,
    jsonb_build_object('child_id', p_child_id, 'relationship', p_relationship));

  RETURN v_guardian_id;
END;
$$;

-- ─── 9. RPC: accept_guardian_invite ──────────────────────────────────────────
-- Called by collector after auth signup to link their user_id to guardian row
CREATE OR REPLACE FUNCTION public.accept_guardian_invite(
  p_invitation_token TEXT,
  p_access_code      TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_collector_id UUID := auth.uid();
  v_guardian     RECORD;
  v_match        BOOLEAN;
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

  -- Verify access code if set
  IF v_guardian.access_code_hash IS NOT NULL THEN
    IF p_access_code IS NULL THEN
      RETURN jsonb_build_object('error', 'access_code_required');
    END IF;
    -- Simple equality check for MVP; replace with crypt() in prod
    IF v_guardian.access_code_hash <> p_access_code THEN
      RETURN jsonb_build_object('error', 'invalid_access_code');
    END IF;
  END IF;

  UPDATE public.guardians
  SET collector_user_id = v_collector_id,
      invitation_token  = NULL,
      updated_at        = NOW()
  WHERE id = v_guardian.id;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_collector_id, 'guardian_invite_accepted', 'guardians', v_guardian.id,
    jsonb_build_object('parent_id', v_guardian.parent_id));

  RETURN jsonb_build_object('guardian_id', v_guardian.id, 'parent_id', v_guardian.parent_id);
END;
$$;

-- ─── 10. RPC: toggle_guardian_active ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_guardian_active(
  p_guardian_id UUID,
  p_is_active   BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_id UUID := auth.uid();
BEGIN
  UPDATE public.guardians
  SET is_active  = p_is_active,
      updated_at = NOW()
  WHERE id = p_guardian_id
    AND parent_id = v_parent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Invalidate active QR codes for this guardian
  UPDATE public.qr_codes
  SET is_used = TRUE,
      used_at = NOW()
  WHERE guardian_id = p_guardian_id
    AND is_used = FALSE;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (v_parent_id, CASE WHEN p_is_active THEN 'guardian_activated' ELSE 'guardian_deactivated' END,
    'guardians', p_guardian_id, jsonb_build_object('is_active', p_is_active));
END;
$$;

-- ─── 11. Realtime ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.guardians;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_identities;
