-- ============================================================
-- INQUIRIES: DROP TABLE + RECREATE (full schema + RLS)
-- Run in Supabase SQL Editor. All existing inquiry data will be lost.
--
-- Columns match: LeadCaptureModal, Contact page createInquiry, Admin Inquiries
-- (id, created_at, updated_at, name, email, phone, event_type, message,
--  status, notes, instagram_id, venue, is_read)
-- ============================================================

-- 1. Drop all RLS policies on inquiries (required before dropping table)
DROP POLICY IF EXISTS "inquiries_insert_any" ON inquiries;
DROP POLICY IF EXISTS "inquiries_select_admins" ON inquiries;
DROP POLICY IF EXISTS "inquiries_delete_admins" ON inquiries;
DROP POLICY IF EXISTS "inquiries_update_admins" ON inquiries;
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

-- 2. Remove from realtime publication if present (so drop table is clean)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inquiries') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE inquiries;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 3. Drop the table (CASCADE drops dependent objects e.g. triggers)
DROP TABLE IF EXISTS inquiries CASCADE;

-- 4. Create inquiries table with full schema (matches Lead Capture, Contact form, Admin)
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  notes TEXT,
  instagram_id TEXT,
  venue TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- 5. Indexes for admin list + filters
CREATE INDEX idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX idx_inquiries_status ON inquiries (status);
CREATE INDEX idx_inquiries_venue ON inquiries (venue);

-- 6. Auto-update updated_at
CREATE OR REPLACE FUNCTION inquiries_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE PROCEDURE inquiries_set_updated_at();

-- 7. Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies: explicit INSERT for anon/authenticated (PostgREST uses these roles)
CREATE POLICY "inquiries_insert_anon"
  ON inquiries FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "inquiries_insert_authenticated"
  ON inquiries FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "inquiries_select_admins"
  ON inquiries FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "inquiries_update_admins"
  ON inquiries FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "inquiries_delete_admins"
  ON inquiries FOR DELETE
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- 9. Table-level GRANTs (required: 401/42501 = insufficient_privilege without these)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, SELECT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;

-- 10. Realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
