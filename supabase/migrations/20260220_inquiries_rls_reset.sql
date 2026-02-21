-- ============================================================
-- INQUIRIES RLS – FULL RESET (drop all policies, recreate)
-- Run this in Supabase SQL Editor if you still get 401 on insert.
-- ============================================================

-- 1. Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Drop every policy that might exist on inquiries (all known names)
DROP POLICY IF EXISTS "Allow all to insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow anon to insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow authenticated to insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for public" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for everyone" ON inquiries;
DROP POLICY IF EXISTS "Public can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public and admins can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable select for admins" ON inquiries;
DROP POLICY IF EXISTS "Enable update for admins" ON inquiries;
DROP POLICY IF EXISTS "Enable delete for admins" ON inquiries;
DROP POLICY IF EXISTS "Admins can view inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can delete inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view and manage inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable read access for all users" ON inquiries;

-- 3. Create exactly 4 policies

-- INSERT: anyone (anon, authenticated, etc.) can insert – for lead capture & contact form
CREATE POLICY "inquiries_insert_any"
ON inquiries
FOR INSERT
WITH CHECK (true);

-- SELECT: only admins (from admin_users table)
CREATE POLICY "inquiries_select_admins"
ON inquiries
FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_users));

-- UPDATE: only admins
CREATE POLICY "inquiries_update_admins"
ON inquiries
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- DELETE: only admins
CREATE POLICY "inquiries_delete_admins"
ON inquiries
FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));
