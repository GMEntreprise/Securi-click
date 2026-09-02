-- The school profile uploads its logo to school-logos, then asks Supabase for a
-- public URL. That bucket was created private, so the URL it stores can never
-- resolve and no school logo has ever displayed: schools.logo_url holds zero
-- rows, which matches.
--
-- A school logo is public-facing identity, not personal data, so the bucket
-- joins the other logo and avatar buckets rather than moving the whole upload
-- path to signed URLs for it alone.

UPDATE storage.buckets
SET public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'school-logos';

DROP POLICY IF EXISTS "school_logos_admin_write" ON storage.objects;
CREATE POLICY "school_logos_admin_write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'school-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.school_memberships membership
      WHERE membership.user_id   = auth.uid()
        AND membership.role      = 'school_admin'
        AND membership.is_active = TRUE
    )
  )
  WITH CHECK (
    bucket_id = 'school-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.school_memberships membership
      WHERE membership.user_id   = auth.uid()
        AND membership.role      = 'school_admin'
        AND membership.is_active = TRUE
    )
  );
