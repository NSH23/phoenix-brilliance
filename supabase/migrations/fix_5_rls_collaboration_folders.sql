-- ============================================
-- FIX 5: RLS on collaboration_folders (public read; authenticated can manage)
-- Run this in Supabase SQL Editor.
-- ============================================

ALTER TABLE collaboration_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view collaboration folders" ON collaboration_folders;
CREATE POLICY "Public can view collaboration folders"
  ON collaboration_folders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage collaboration folders" ON collaboration_folders;
DROP POLICY IF EXISTS "Authenticated can manage collaboration folders" ON collaboration_folders;
CREATE POLICY "Authenticated can manage collaboration folders"
  ON collaboration_folders FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
