-- Migration 017: Encode invitation_token in the Supabase OTP magic link
-- The parent's "inviteCollector" call now passes the guardian's invitation_token
-- as OTP metadata. When the collector clicks the link, the app extracts the
-- token from the URL and can accept the invite + verify PIN in one step,
-- without ever asking the collector to type their email.
--
-- Deep link format after this migration:
--   securiclick://auth/callback?code=<pkce_code>&invitation_token=<token>
--
-- The invitation_token is stored in the OTP's redirect_to URL as a query param.
-- Supabase appends it transparently to the magic link sent to the collector.
--
-- No SQL schema changes needed — invitation_token already exists on guardians.
-- This migration only documents the URL contract and adds a helper RPC used by
-- the client to look up a guardian record by token before the collector has a
-- Supabase session (so the PIN screen can show context like the child's name).

-- ─── Helper RPC: get_invite_context ──────────────────────────────────────────
-- Returns minimal public info about a pending invitation so the PIN screen can
-- greet the collector before they authenticate.
-- SECURITY: returns only non-sensitive fields. access_code_hash is never exposed.
CREATE OR REPLACE FUNCTION public.get_invite_context(
  p_invitation_token TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_guardian RECORD;
  v_child    RECORD;
BEGIN
  SELECT g.id, g.first_name, g.last_name, g.relationship,
         g.access_code_hash IS NOT NULL AS has_pin,
         g.child_id
  INTO v_guardian
  FROM public.guardians g
  WHERE g.invitation_token = p_invitation_token
    AND g.collector_user_id IS NULL
    AND g.is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  SELECT c.first_name, c.last_name
  INTO v_child
  FROM public.children c
  WHERE c.id = v_guardian.child_id;

  RETURN jsonb_build_object(
    'guardian_id',      v_guardian.id,
    'first_name',       v_guardian.first_name,
    'last_name',        v_guardian.last_name,
    'relationship',     v_guardian.relationship,
    'has_pin',          v_guardian.has_pin,
    'child_first_name', v_child.first_name,
    'child_last_name',  v_child.last_name
  );
END;
$$;
