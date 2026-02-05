-- ============================================
-- Storage Bucket Policies for Phoenix Events
-- ============================================
-- Run this AFTER creating storage buckets in Supabase Dashboard
-- Replace BUCKET_NAME with actual bucket names

-- ============================================
-- EVENT-IMAGES BUCKET POLICIES
-- ============================================
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- ALBUM-IMAGES BUCKET POLICIES
-- ============================================
CREATE POLICY "Public can view album images"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-images');

CREATE POLICY "Admins can upload album images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'album-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update album images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'album-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete album images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'album-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- PARTNER-LOGOS BUCKET POLICIES
-- ============================================
CREATE POLICY "Public can view partner logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-logos');

CREATE POLICY "Admins can upload partner logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-logos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update partner logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'partner-logos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete partner logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'partner-logos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- GALLERY-IMAGES BUCKET POLICIES
-- ============================================
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- BEFORE-AFTER-IMAGES BUCKET POLICIES
-- ============================================
-- Create bucket first: Storage > New bucket > "before-after-images"
-- Set to Public. Leave "Allowed MIME types" empty (or use image/*) to allow PNG, JPEG, etc.
CREATE POLICY "Public can view before-after images"
ON storage.objects FOR SELECT
USING (bucket_id = 'before-after-images');

CREATE POLICY "Admins can upload before-after images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'before-after-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update before-after images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'before-after-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete before-after images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'before-after-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- TESTIMONIAL-AVATARS BUCKET POLICIES
-- ============================================
CREATE POLICY "Public can view testimonial avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonial-avatars');

CREATE POLICY "Admins can upload testimonial avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'testimonial-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update testimonial avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'testimonial-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete testimonial avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'testimonial-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- ADMIN-AVATARS BUCKET POLICIES (Private)
-- ============================================
CREATE POLICY "Admins can view admin avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'admin-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can upload admin avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'admin-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update admin avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'admin-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete admin avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'admin-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- TEAM-PHOTOS BUCKET POLICIES (Private)
-- ============================================
-- If you previously created "Public can view team photos", drop it first:
--   DROP POLICY IF EXISTS "Public can view team photos" ON storage.objects;
CREATE POLICY "Admins can view team photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'team-photos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can upload team photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-photos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update team photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-photos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete team photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-photos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- TEAM-DOCUMENTS BUCKET POLICIES (Private)
-- ============================================
CREATE POLICY "Admins can view team documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'team-documents' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can upload team documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-documents' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update team documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-documents' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete team documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-documents' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

-- ============================================
-- NOTES
-- ============================================
-- 1. Make sure buckets are created in Supabase Dashboard first
-- 2. Set public buckets to "Public" in bucket settings
-- 3. These policies allow:
--    - Public read access for public buckets (event-images, album-images, partner-logos,
--      gallery-images, testimonial-avatars)
--    - Admin-only write/update/delete access
--    - Private access for admin-avatars, team-photos, and team-documents (admin-only SELECT/INSERT/UPDATE/DELETE)
-- 4. See TEAM_STORAGE_SETUP.md for creating team-photos and team-documents buckets
