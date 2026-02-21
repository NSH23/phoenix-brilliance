-- ============================================================
-- FIX 401 (error 42501): Grant table-level privileges to anon/authenticated
-- PostgREST returns 401 when the role has no INSERT on the table (RLS is checked after).
-- Run this in Supabase SQL Editor. Safe to run even if already granted.
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, UPDATE, DELETE ON public.inquiries TO authenticated;

-- Allow anon to SELECT rows returned after INSERT (return=representation)
GRANT SELECT ON public.inquiries TO anon;
