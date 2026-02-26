-- Site logo storage bucket and site_settings key for logo URL.
-- Run after service-images bucket if you haven't already. Logo can be uploaded to this bucket
-- and the public URL (or path) stored in site_settings.site_logo_url for use site-wide.

-- 1. Create site-logo bucket (public, small size limit for logo only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-logo',
  'site-logo',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Public read for site-logo
DROP POLICY IF EXISTS "Public read site-logo" ON storage.objects;
CREATE POLICY "Public read site-logo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-logo');

-- 3. Authenticated (admin) upload/update/delete
DROP POLICY IF EXISTS "Authenticated upload site-logo" ON storage.objects;
CREATE POLICY "Authenticated upload site-logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-logo');

DROP POLICY IF EXISTS "Authenticated update site-logo" ON storage.objects;
CREATE POLICY "Authenticated update site-logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-logo');

DROP POLICY IF EXISTS "Authenticated delete site-logo" ON storage.objects;
CREATE POLICY "Authenticated delete site-logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-logo');

-- 4. Optional: seed site_logo_url so admin can set it later (empty = use /logo.png fallback)
INSERT INTO site_settings (key, value, type)
VALUES ('site_logo_url', '', 'text')
ON CONFLICT (key) DO NOTHING;
