-- Migration 006: server-side QR generation + history search RPC

-- ─── 1. RPC: generate_qr_code ───────────────────────────────────────────────
-- Token generated server-side using gen_random_uuid for unguessability.
-- Parent must own the child (enforced via RLS on qr_codes + parent_id check).
CREATE OR REPLACE FUNCTION public.generate_qr_code(
  p_parent_id      UUID,
  p_child_id       UUID,
  p_guardian_id    UUID DEFAULT NULL,
  p_expires_in_hours INT DEFAULT 24
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller   UUID := auth.uid();
  v_token    TEXT;
  v_qr_id    UUID;
BEGIN
  IF v_caller <> p_parent_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Verify caller owns the child
  IF NOT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = p_child_id AND parent_id = v_caller
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Invalidate any existing unused QR for this child/guardian pair
  UPDATE public.qr_codes
  SET is_used = TRUE, used_at = NOW()
  WHERE parent_id  = v_caller
    AND child_id   = p_child_id
    AND (p_guardian_id IS NULL OR guardian_id = p_guardian_id)
    AND is_used    = FALSE;

  -- Generate cryptographically secure token
  v_token := 'SC-' || upper(replace(gen_random_uuid()::TEXT, '-', ''));

  INSERT INTO public.qr_codes (
    parent_id, child_id, guardian_id, token, expires_at, is_used
  ) VALUES (
    v_caller, p_child_id, p_guardian_id,
    v_token,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
    FALSE
  )
  RETURNING id INTO v_qr_id;

  RETURN v_qr_id;
END;
$$;

-- ─── 2. RPC: search_pickup_history ──────────────────────────────────────────
-- PostgREST .or() on joined tables doesn't work — use a server-side function.
CREATE OR REPLACE FUNCTION public.search_pickup_history(
  p_parent_id UUID,
  p_search    TEXT,
  p_limit     INT DEFAULT 20
) RETURNS SETOF public.pickup_history
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() <> p_parent_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT ph.*
  FROM public.pickup_history ph
  LEFT JOIN public.children  c ON c.id = ph.child_id
  LEFT JOIN public.guardians g ON g.id = ph.collector_id
  WHERE ph.parent_id = p_parent_id
    AND ph.is_archived = FALSE
    AND (
      c.first_name ILIKE '%' || p_search || '%'
      OR c.last_name  ILIKE '%' || p_search || '%'
      OR g.first_name ILIKE '%' || p_search || '%'
      OR g.last_name  ILIKE '%' || p_search || '%'
    )
  ORDER BY ph.scanned_at DESC
  LIMIT p_limit;
END;
$$;

-- ─── 3. Idempotent realtime guard for pickup_history ────────────────────────
-- Migration 003 used a bare ALTER PUBLICATION which fails on re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pickup_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_history;
  END IF;
END$$;
