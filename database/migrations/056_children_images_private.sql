-- Proved against the deployed project: a file placed in children-images came
-- back over HTTP 200 with no apikey, no Authorization header and no session.
-- A public bucket does not consult RLS on read, so a photo of a child was one
-- leaked URL away from being public for good, with no expiry and no way to
-- revoke it. Migration 002 had intended these buckets to be private; the lines
-- were commented out and the buckets were created public by hand instead.
--
-- The window to fix this is now: children.photo_url holds zero rows, so there
-- is nothing to migrate and no stored URL to rewrite. The application now keeps
-- the object path and asks for a signed URL when it renders.
--
-- Three audiences legitimately see a child's photo, and each gets its own
-- policy rather than a shared public door: the parent who owns the folder, the
-- staff of the school that child attends, and a collector the parent linked to
-- that child.

UPDATE storage.buckets
SET public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'children-images';

DROP POLICY IF EXISTS "children_images_owner" ON storage.objects;
CREATE POLICY "children_images_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'children-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'children-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "children_images_school_read" ON storage.objects;
CREATE POLICY "children_images_school_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'children-images'
    AND EXISTS (
      SELECT 1
      FROM public.children child
      JOIN public.school_memberships membership
        ON membership.school_id = child.school_id
      WHERE child.parent_id::text = (storage.foldername(name))[1]
        AND membership.user_id   = auth.uid()
        AND membership.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "children_images_collector_read" ON storage.objects;
CREATE POLICY "children_images_collector_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'children-images'
    AND EXISTS (
      SELECT 1
      FROM public.guardians guardian
      JOIN public.children child ON child.id = guardian.child_id
      WHERE guardian.collector_user_id = auth.uid()
        AND guardian.is_active         = TRUE
        AND child.parent_id::text      = (storage.foldername(name))[1]
    )
  );
