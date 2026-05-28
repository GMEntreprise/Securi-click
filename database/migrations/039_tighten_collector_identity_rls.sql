-- ============================================================
-- MIGRATION 039 — Tighten RLS on collector_identities
--
-- Replaces the parent_update_verification policy so a parent
-- can only update identity rows for collectors they actually
-- invited (guardian link exists).
-- ============================================================

DROP POLICY IF EXISTS "parent_update_verification" ON public.collector_identities;

CREATE POLICY "parent_update_verification" ON public.collector_identities
  FOR UPDATE
  USING (
    auth.uid() = parent_id
    AND EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_id = auth.uid()
        AND g.collector_user_id = collector_identities.collector_user_id
    )
  )
  WITH CHECK (
    auth.uid() = parent_id
    AND EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_id = auth.uid()
        AND g.collector_user_id = collector_identities.collector_user_id
    )
  );
