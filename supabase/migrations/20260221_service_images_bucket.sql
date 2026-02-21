-- Create service-images storage bucket for admin service images (homepage "Our Services" section).
-- Run this if the bucket does not exist (e.g. after "Bucket not found" errors).
-- You can also create the bucket in Dashboard: Storage → New bucket → id: service-images, Public: Yes.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read for service images (public bucket)
DROP POLICY IF EXISTS "Public read service-images" ON storage.objects;
CREATE POLICY "Public read service-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

-- Allow authenticated users to upload/update/delete (admin)
DROP POLICY IF EXISTS "Authenticated upload service-images" ON storage.objects;
CREATE POLICY "Authenticated upload service-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Authenticated update service-images" ON storage.objects;
CREATE POLICY "Authenticated update service-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Authenticated delete service-images" ON storage.objects;
CREATE POLICY "Authenticated delete service-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'service-images');
