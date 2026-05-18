-- Migration 022: Create missing storage buckets for collector avatars and identity documents

-- collector-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collector-avatars',
  'collector-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- identity-documents bucket (private — signed URLs only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-documents',
  'identity-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: collector can upload/read their own avatar
DROP POLICY IF EXISTS "collector_avatars_owner" ON storage.objects;
CREATE POLICY "collector_avatars_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'collector-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'collector-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: collector can upload their own identity documents
DROP POLICY IF EXISTS "identity_documents_owner" ON storage.objects;
CREATE POLICY "identity_documents_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'identity-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'identity-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- RLS: parent can also read identity documents for their collectors
DROP POLICY IF EXISTS "identity_documents_parent_read" ON storage.objects;
CREATE POLICY "identity_documents_parent_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'identity-documents'
    AND EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.parent_id = auth.uid()
        AND g.collector_user_id::text = (storage.foldername(name))[2]
    )
  );
