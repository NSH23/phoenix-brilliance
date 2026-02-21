-- ==========================================
-- FIX INQUIRIES RLS (CLEAN SLATE)
-- ==========================================

-- 1. Enable RLS (just in case)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
-- We drop by name, covering common variations
DROP POLICY IF EXISTS "Admins can delete inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view and manage inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public and admins can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for everyone" ON inquiries;
DROP POLICY IF EXISTS "Enable read access for all users" ON inquiries;

-- 3. Create NEW, CLEAN policies

-- Allow public to insert (Essential for contact form & lead capture)
-- WITH CHECK (true) allows inserting ANY data (including status='new')
CREATE POLICY "Enable insert for public"
ON inquiries FOR INSERT
WITH CHECK (true);

-- Allow admins to do everything
-- Using a single policy for simplicity, or split if preferred.
-- Splitting is clearer for debugging.

CREATE POLICY "Enable select for admins"
ON inquiries FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Enable update for admins"
ON inquiries FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Enable delete for admins"
ON inquiries FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));
