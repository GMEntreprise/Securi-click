-- Migration 007: allow parent to update their own children + updated_at trigger

-- ─── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_children_updated_at'
  ) THEN
    CREATE TRIGGER trg_children_updated_at
      BEFORE UPDATE ON public.children
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- ─── RLS: parent can UPDATE their own children ───────────────────────────────
DROP POLICY IF EXISTS "parent_update_own_children" ON public.children;

CREATE POLICY "parent_update_own_children" ON public.children
  FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- ─── RLS: parent can SELECT their own children ───────────────────────────────
DROP POLICY IF EXISTS "parent_select_own_children" ON public.children;

CREATE POLICY "parent_select_own_children" ON public.children
  FOR SELECT
  USING (auth.uid() = parent_id);

-- ─── RLS: parent can INSERT children ────────────────────────────────────────
DROP POLICY IF EXISTS "parent_insert_own_children" ON public.children;

CREATE POLICY "parent_insert_own_children" ON public.children
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- ─── RLS: parent can DELETE their own children ───────────────────────────────
DROP POLICY IF EXISTS "parent_delete_own_children" ON public.children;

CREATE POLICY "parent_delete_own_children" ON public.children
  FOR DELETE
  USING (auth.uid() = parent_id);

-- ─── Ensure children table has updated_at column ────────────────────────────
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── Realtime: children updates ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'children'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.children;
  END IF;
END$$;
