-- ============================================================
-- FIX 401 on homepage/contact form: allow anon to INSERT only.
-- App no longer uses .select() after insert, so anon only needs INSERT.
-- Run in Supabase SQL Editor. Safe to run multiple times.
-- ============================================================

-- Ensure schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Anon: INSERT only (no SELECT needed for form submit)
GRANT INSERT ON public.inquiries TO anon;

-- Optional: allow anon to SELECT so future .select() after insert would work (not required for current app)
-- GRANT SELECT ON public.inquiries TO anon;

-- Authenticated (admins): full access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;

-- Drop any conflicting insert policies and create a single clear one for anon
DROP POLICY IF EXISTS "Allow all to insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for public" ON inquiries;
DROP POLICY IF EXISTS "Public can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public can create inquiries" ON inquiries;

CREATE POLICY "inquiries_insert_anon"
  ON inquiries FOR INSERT TO anon
  WITH CHECK (true);

-- Ensure authenticated can also insert (e.g. if admin creates inquiry)
DROP POLICY IF EXISTS "inquiries_insert_authenticated" ON inquiries;
CREATE POLICY "inquiries_insert_authenticated"
  ON inquiries FOR INSERT TO authenticated
  WITH CHECK (true);
