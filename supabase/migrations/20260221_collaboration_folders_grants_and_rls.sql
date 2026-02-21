-- ============================================
-- Fix: collaboration_folders not getting rows when admin creates folders
-- Cause: Table-level GRANTs may be missing; RLS must allow authenticated INSERT/UPDATE/DELETE.
-- Run this in Supabase SQL Editor or via supabase db push.
-- ============================================

-- 1. Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS collaboration_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES collaboration_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table-level GRANTs (required for PostgREST; RLS alone is not enough)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.collaboration_folders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaboration_folders TO authenticated;

-- 3. RLS: enable and set policies
ALTER TABLE collaboration_folders ENABLE ROW LEVEL SECURITY;

-- Public read (for public collaboration page)
DROP POLICY IF EXISTS "Public can view collaboration folders" ON collaboration_folders;
CREATE POLICY "Public can view collaboration folders"
  ON collaboration_folders FOR SELECT
  USING (true);

-- Drop any single FOR ALL policy so we can use separate INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Authenticated users can manage collaboration folders" ON collaboration_folders;
DROP POLICY IF EXISTS "Authenticated can manage collaboration folders" ON collaboration_folders;

-- Explicit INSERT: any authenticated user can create folders
DROP POLICY IF EXISTS "Authenticated can insert collaboration folders" ON collaboration_folders;
CREATE POLICY "Authenticated can insert collaboration folders"
  ON collaboration_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Explicit UPDATE
DROP POLICY IF EXISTS "Authenticated can update collaboration folders" ON collaboration_folders;
CREATE POLICY "Authenticated can update collaboration folders"
  ON collaboration_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Explicit DELETE
DROP POLICY IF EXISTS "Authenticated can delete collaboration folders" ON collaboration_folders;
CREATE POLICY "Authenticated can delete collaboration folders"
  ON collaboration_folders FOR DELETE
  TO authenticated
  USING (true);

-- Service role full access (for migrations / server-side)
DROP POLICY IF EXISTS "Service role full access collaboration_folders" ON collaboration_folders;
CREATE POLICY "Service role full access collaboration_folders"
  ON collaboration_folders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
