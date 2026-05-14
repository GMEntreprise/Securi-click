-- Migration 010: RPC to fetch pending invitations by email
-- Called by the collector after magic link login to find invites awaiting acceptance.
-- Runs SECURITY DEFINER to bypass RLS (collector_user_id IS NULL on pending rows).

-- ─── 1. Index on guardians.email for fast lookup ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guardians_email
  ON public.guardians (lower(email))
  WHERE collector_user_id IS NULL AND invitation_token IS NOT NULL;

-- ─── 2. RPC: get_pending_invites_by_email ─────────────────────────────────────
-- Returns pending guardian rows whose email matches the caller's auth email.
-- Only returns rows where collector_user_id IS NULL (not yet accepted).
-- Only returns rows where invitation_token IS NOT NULL (valid invite).
CREATE OR REPLACE FUNCTION public.get_pending_invites_by_email(
  p_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_email TEXT;
BEGIN
  -- Verify caller email matches p_email to prevent enumeration
  SELECT email INTO v_caller_email
  FROM auth.users
  WHERE id = auth.uid();

  IF lower(v_caller_email) <> lower(p_email) THEN
    RETURN '[]'::JSONB;
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_json), '[]'::JSONB)
    FROM (
      SELECT jsonb_build_object(
        'id',               g.id,
        'invitation_token', g.invitation_token,
        'access_code_hash', CASE WHEN g.access_code_hash IS NOT NULL THEN 'set' ELSE NULL END,
        'first_name',       g.first_name,
        'last_name',        g.last_name,
        'relationship',     g.relationship,
        'parent_id',        g.parent_id,
        'child',            jsonb_build_object(
                              'id',         c.id,
                              'first_name', c.first_name,
                              'last_name',  c.last_name,
                              'photo_url',  c.photo_url
                            )
      ) AS row_json
      FROM public.guardians g
      LEFT JOIN public.children c ON c.id = g.child_id
      WHERE lower(g.email) = lower(p_email)
        AND g.collector_user_id IS NULL
        AND g.invitation_token IS NOT NULL
        AND g.is_active = TRUE
      ORDER BY g.invited_at DESC
    ) sub
  );
END;
$$;
