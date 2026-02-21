-- ============================================
-- Fix: Allow authenticated users to INSERT/UPDATE/DELETE collaboration_folders
-- Run in Supabase SQL Editor if folder creation fails with no rows or permission error.
-- ============================================

ALTER TABLE collaboration_folders ENABLE ROW LEVEL SECURITY;

-- Ensure public can read (for public collaboration page)
DROP POLICY IF EXISTS "Public can view collaboration folders" ON collaboration_folders;
CREATE POLICY "Public can view collaboration folders"
  ON collaboration_folders FOR SELECT
  USING (true);

-- Drop the single FOR ALL policy if it exists (we replace with separate policies)
DROP POLICY IF EXISTS "Authenticated users can manage collaboration folders" ON collaboration_folders;
DROP POLICY IF EXISTS "Authenticated can manage collaboration folders" ON collaboration_folders;

-- Explicit INSERT: any authenticated user can create folders
CREATE POLICY "Authenticated can insert collaboration folders"
  ON collaboration_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Explicit UPDATE: any authenticated user can update folders
CREATE POLICY "Authenticated can update collaboration folders"
  ON collaboration_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Explicit DELETE: any authenticated user can delete folders
CREATE POLICY "Authenticated can delete collaboration folders"
  ON collaboration_folders FOR DELETE
  TO authenticated
  USING (true);

-- Service role can do everything (for migrations/backend)
DROP POLICY IF EXISTS "Service role full access collaboration_folders" ON collaboration_folders;
CREATE POLICY "Service role full access collaboration_folders"
  ON collaboration_folders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
