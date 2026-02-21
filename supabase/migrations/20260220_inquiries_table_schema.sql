-- ============================================================
-- INQUIRIES TABLE – ensure full schema (matches app + insert payload)
-- Columns: id, name, email, phone, event_type, message, status, notes, created_at, updated_at, instagram_id, venue, is_read
--
-- 401 on POST = wrong API key. In .env use VITE_SUPABASE_ANON_KEY = anon (public) key from Project Settings → API, not service_role.
-- ============================================================

-- 1. Create table only if it doesn't exist (full schema)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','closed')),
  notes TEXT,
  instagram_id TEXT,
  venue TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- 2. If table already existed, add any missing columns (no-op if they exist)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS instagram_id TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 3. Ensure updated_at refreshes (optional trigger)
CREATE OR REPLACE FUNCTION inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inquiries_updated_at ON inquiries;
CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE PROCEDURE inquiries_updated_at();

-- 4. Index for admin listing
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_venue ON inquiries(venue);
