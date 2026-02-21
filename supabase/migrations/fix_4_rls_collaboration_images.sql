-- ============================================
-- FIX 4: RLS on collaboration_images (public read; authenticated can manage)
-- Run this in Supabase SQL Editor.
-- ============================================

ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view collaboration images" ON collaboration_images;
CREATE POLICY "Public can view collaboration images"
  ON collaboration_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage collaboration images" ON collaboration_images;
CREATE POLICY "Authenticated can manage collaboration images"
  ON collaboration_images FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
