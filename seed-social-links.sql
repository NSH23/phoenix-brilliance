-- ============================================
-- 2. SOCIAL LINKS TABLE
-- ============================================
-- Run this in Supabase SQL Editor if social_links doesn't exist yet.
-- Requires: admin_users table (for RLS policy)

-- Ensure helper function exists (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_links_platform ON social_links(platform);
CREATE INDEX IF NOT EXISTS idx_social_links_is_active ON social_links(is_active);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active social links"
  ON social_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage social links"
  ON social_links FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default social links
INSERT INTO social_links (platform, url, is_active)
VALUES
  ('facebook', 'https://facebook.com/phoenixevents', true),
  ('instagram', 'https://instagram.com/phoenixevents', true),
  ('youtube', 'https://youtube.com/@phoenixevents', true),
  ('whatsapp', '+919876543210', true)
ON CONFLICT (platform) DO NOTHING;
