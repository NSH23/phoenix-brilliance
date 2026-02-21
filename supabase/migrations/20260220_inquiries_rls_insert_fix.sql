-- ============================================================
-- FIX: "new row violates row-level security policy for table inquiries"
-- Use explicit INSERT policies for anon and authenticated (PostgREST uses these roles).
-- Run in Supabase SQL Editor.
-- ============================================================

DROP POLICY IF EXISTS "inquiries_insert_any" ON inquiries;

CREATE POLICY "inquiries_insert_anon"
  ON inquiries FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "inquiries_insert_authenticated"
  ON inquiries FOR INSERT TO authenticated
  WITH CHECK (true);
