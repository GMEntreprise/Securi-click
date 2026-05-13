-- Migration 003: pickup_history table with intelligent history features

-- ─── Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pickup_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id        UUID REFERENCES public.children(id) ON DELETE SET NULL,
  collector_id    UUID REFERENCES public.guardians(id) ON DELETE SET NULL,
  school_id       UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  staff_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_jti          TEXT,
  status          TEXT NOT NULL CHECK (status IN ('completed', 'denied', 'cancelled')),
  denial_reason   TEXT,
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pickup_time     TIMESTAMPTZ,
  device_info     JSONB,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pickup_history_parent_scanned
  ON public.pickup_history (parent_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_pickup_history_parent_status
  ON public.pickup_history (parent_id, status);

CREATE INDEX IF NOT EXISTS idx_pickup_history_parent_archived
  ON public.pickup_history (parent_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_pickup_history_child
  ON public.pickup_history (child_id);

CREATE INDEX IF NOT EXISTS idx_pickup_history_pinned
  ON public.pickup_history (parent_id, is_pinned) WHERE is_pinned = TRUE;

-- ─── Full-text search ───────────────────────────────────────────────────────
-- Materialized column for fast search across child/guardian names
-- (Populated via trigger or app layer; simple pattern match works for MVP)

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.pickup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_read_own_history" ON public.pickup_history
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "parent_update_own_history" ON public.pickup_history
  FOR UPDATE USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "staff_insert_history" ON public.pickup_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('staff', 'school_admin')
    )
  );

-- ─── Monthly counts view ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.pickup_history_monthly_counts AS
SELECT
  parent_id,
  EXTRACT(YEAR FROM scanned_at)::INT  AS year,
  EXTRACT(MONTH FROM scanned_at)::INT AS month,
  COUNT(*) FILTER (WHERE NOT is_archived) AS count,
  COUNT(*) FILTER (WHERE is_archived)     AS archived_count
FROM public.pickup_history
GROUP BY parent_id, year, month;

-- RLS on view is inherited from the underlying table via security_invoker
ALTER VIEW public.pickup_history_monthly_counts SET (security_invoker = TRUE);

-- ─── Archive RPCs ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.archive_history_month(
  p_parent_id UUID,
  p_year      INT,
  p_month     INT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() <> p_parent_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.pickup_history
  SET is_archived = TRUE,
      archived_at = NOW()
  WHERE parent_id = p_parent_id
    AND EXTRACT(YEAR FROM scanned_at)::INT  = p_year
    AND EXTRACT(MONTH FROM scanned_at)::INT = p_month
    AND is_archived = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_history_month(
  p_parent_id UUID,
  p_year      INT,
  p_month     INT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() <> p_parent_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.pickup_history
  SET is_archived = FALSE,
      archived_at = NULL
  WHERE parent_id = p_parent_id
    AND EXTRACT(YEAR FROM scanned_at)::INT  = p_year
    AND EXTRACT(MONTH FROM scanned_at)::INT = p_month
    AND is_archived = TRUE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─── Realtime ───────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_history;
