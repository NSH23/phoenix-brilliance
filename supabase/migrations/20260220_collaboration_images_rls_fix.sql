-- ============================================
-- Fix collaboration_images RLS so admin PATCH/UPDATE works (stops 409 Conflict)
-- ============================================
-- Cause: 409 happens when RLS allows the request but 0 rows are updated (e.g. policy
-- blocks UPDATE). This migration normalizes policies so only users in admin_users
-- can INSERT/UPDATE/DELETE, matching the rest of the app (inquiries, etc.).
-- Run in Supabase SQL Editor if not using Supabase CLI.
-- ============================================

-- Drop every policy name that might exist from various past migrations
DROP POLICY IF EXISTS "Public can view collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Authenticated can manage collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can manage collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can insert collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can update collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can delete collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Public and admins can view collaboration images" ON collaboration_images;

-- Ensure RLS is on
ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can view)
CREATE POLICY "Public can view collaboration images"
  ON collaboration_images FOR SELECT
  USING (true);

-- Only users listed in admin_users can insert/update/delete
-- (select auth.uid()) avoids RLS initplan performance warning
CREATE POLICY "Admins can manage collaboration images"
  ON collaboration_images FOR ALL
  USING ((select auth.uid()) IN (SELECT id FROM admin_users))
  WITH CHECK ((select auth.uid()) IN (SELECT id FROM admin_users));
