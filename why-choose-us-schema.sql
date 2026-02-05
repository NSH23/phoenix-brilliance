-- ============================================
-- Why Choose Us - Stats & Reasons
-- ============================================
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql
-- (depends on update_updated_at_column and admin_users)

-- ============================================
-- 1. WHY_CHOOSE_US_STATS (the 4 stat cards)
-- ============================================
CREATE TABLE IF NOT EXISTS why_choose_us_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_value TEXT NOT NULL,
  stat_label TEXT NOT NULL,
  stat_description TEXT,
  icon_key TEXT UNIQUE NOT NULL CHECK (icon_key IN ('trophy', 'heart', 'users', 'shield')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_why_choose_us_stats_display_order ON why_choose_us_stats(display_order);

ALTER TABLE why_choose_us_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view why choose us stats"
  ON why_choose_us_stats FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage why choose us stats"
  ON why_choose_us_stats FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_why_choose_us_stats_updated_at
  BEFORE UPDATE ON why_choose_us_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. WHY_CHOOSE_US_REASONS ("What Sets Us Apart")
-- ============================================
CREATE TABLE IF NOT EXISTS why_choose_us_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_why_choose_us_reasons_display_order ON why_choose_us_reasons(display_order);

ALTER TABLE why_choose_us_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view why choose us reasons"
  ON why_choose_us_reasons FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage why choose us reasons"
  ON why_choose_us_reasons FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_why_choose_us_reasons_updated_at
  BEFORE UPDATE ON why_choose_us_reasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO why_choose_us_stats (stat_value, stat_label, stat_description, icon_key, display_order)
VALUES
  ('100+', 'Successful Events', 'Flawlessly executed celebrations', 'trophy', 1),
  ('50+', 'Happy Couples', 'Dream weddings brought to life', 'heart', 2),
  ('25+', 'Trusted Vendors', 'Premium partner network', 'users', 3),
  ('100%', 'Quality Assurance', 'Commitment to excellence', 'shield', 4)
ON CONFLICT (icon_key) DO NOTHING;

-- Run once. Inserts only when the table is empty.
INSERT INTO why_choose_us_reasons (text, display_order)
SELECT * FROM (VALUES
  ('Custom Themes Tailored to Your Vision'::text, 1),
  ('End-to-End Event Execution', 2),
  ('Premium Vendor Network', 3),
  ('Transparent Pricing', 4),
  ('24/7 Event Support', 5),
  ('Post-Event Services', 6)
) AS v(text, display_order)
WHERE NOT EXISTS (SELECT 1 FROM why_choose_us_reasons LIMIT 1);
