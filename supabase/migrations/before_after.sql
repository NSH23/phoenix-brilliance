-- ============================================
-- Before & After Section
-- ============================================
-- Run this in Supabase SQL Editor
-- Stores before/after comparison cards for homepage

CREATE TABLE IF NOT EXISTS before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_before_after_display_order ON before_after(display_order);
CREATE INDEX IF NOT EXISTS idx_before_after_is_active ON before_after(is_active);

ALTER TABLE before_after ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active before_after"
  ON before_after FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage before_after"
  ON before_after FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_before_after_updated_at
  BEFORE UPDATE ON before_after
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
