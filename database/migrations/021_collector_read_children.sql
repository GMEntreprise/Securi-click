-- Migration 021: Allow collector to read children they are authorized for
-- A collector can SELECT a child if there is an active guardian row
-- linking them (collector_user_id = auth.uid()) to that child.

DROP POLICY IF EXISTS "collector_read_authorized_children" ON public.children;

CREATE POLICY "collector_read_authorized_children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.child_id = children.id
        AND g.collector_user_id = auth.uid()
        AND g.is_active = true
    )
  );

-- Same for schools — collector needs to read the school linked to the child
DROP POLICY IF EXISTS "collector_read_authorized_schools" ON public.schools;

CREATE POLICY "collector_read_authorized_schools" ON public.schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.guardians g ON g.child_id = c.id
      WHERE c.school_id = schools.id
        AND g.collector_user_id = auth.uid()
        AND g.is_active = true
    )
  );
