-- ============================================
-- Site Content: Stats (why_choose_us_stats) + Page hero (Events, Gallery)
-- ============================================
-- Run after supabase-schema.sql and why-choose-us-schema.sql
-- 1) Upsert the 4 stat cards into why_choose_us_stats (moved from Why Us to Site Content)
-- 2) Create page_hero_content for Events and Gallery page hero (title, subtitle, description, stats)

-- ============================================
-- 1. WHY_CHOOSE_US_STATS – upsert to your desired values
-- ============================================
INSERT INTO why_choose_us_stats (stat_value, stat_label, stat_description, icon_key, display_order)
VALUES
  ('2200+', 'Successful Events', 'Flawlessly executed celebrations', 'trophy', 1),
  ('1500+', 'Happy Couples', 'Dream weddings brought to life', 'heart', 2),
  ('50+', 'Trusted Partners', 'Premium partner network', 'users', 3),
  ('100%', 'Quality Assurance', 'Commitment to excellence', 'shield', 4)
ON CONFLICT (icon_key) DO UPDATE SET
  stat_value   = EXCLUDED.stat_value,
  stat_label   = EXCLUDED.stat_label,
  stat_description = EXCLUDED.stat_description,
  display_order = EXCLUDED.display_order,
  updated_at   = NOW();

-- ============================================
-- 2. PAGE_HERO_CONTENT – hero blocks for Events and Gallery
-- ============================================
CREATE TABLE IF NOT EXISTS page_hero_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL CHECK (page_key IN ('events', 'gallery')),
  title TEXT,
  subtitle TEXT,
  description TEXT,
  stats JSONB DEFAULT '[]'::jsonb,  -- [{"value":"8+","label":"Event Types"}, ...]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_hero_content_page_key ON page_hero_content(page_key);

ALTER TABLE page_hero_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view page hero content"
  ON page_hero_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage page hero content"
  ON page_hero_content FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_page_hero_content_updated_at
  BEFORE UPDATE ON page_hero_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: insert defaults only when a page_key is missing
INSERT INTO page_hero_content (page_key, title, subtitle, description, stats)
VALUES
  (
    'events',
    'Our Events',
    'Events We Celebrate',
    'From intimate gatherings to grand celebrations, we bring your vision to life with meticulous planning and flawless execution.',
    '[{"value":"8+","label":"Event Types"},{"value":"1+","label":"Events Completed"},{"value":"50+","label":"Happy Clients"}]'::jsonb
  ),
  (
    'gallery',
    'Our Portfolio',
    'Moments We''ve Captured',
    'Browse through our collection of stunning events, each album telling a unique story of celebration and joy.',
    '[{"value":"0+","label":"Photos"},{"value":"1","label":"Albums"},{"value":"1","label":"Event Types"}]'::jsonb
  )
ON CONFLICT (page_key) DO NOTHING;
