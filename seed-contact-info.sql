-- ============================================
-- 3. CONTACT INFO TABLE
-- ============================================
-- Run this in Supabase SQL Editor if contact_info doesn't exist yet.
-- Requires: admin_users table (for RLS policy)

-- Ensure helper function exists (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce single row (only one contact info record allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_info_single ON contact_info((1));

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view contact info"
  ON contact_info FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage contact info"
  ON contact_info FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default contact info (only if table is empty)
INSERT INTO contact_info (email, phone, address)
SELECT 'info@phoenixevents.com', '+91 98765 43210', 'Phoenix Events, 123 Event Street, Mumbai, Maharashtra 400001'
WHERE NOT EXISTS (SELECT 1 FROM contact_info LIMIT 1);
