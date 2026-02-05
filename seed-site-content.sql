-- ============================================
-- 1. SITE CONTENT TABLE
-- ============================================
-- Run this in Supabase SQL Editor if site_content doesn't exist yet.
-- Requires: admin_users table (for RLS policy)

-- Ensure helper function exists (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view site content"
  ON site_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site content"
  ON site_content FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default sections
INSERT INTO site_content (section_key, title, subtitle, description, cta_text, cta_link)
VALUES
  ('hero', 'Creating Magical Moments', 'Your Dream Events, Perfectly Executed', 'We bring your vision to life with exceptional event planning and production services.', 'Get Started', '/contact'),
  ('events', 'Our Event Types', 'Celebrating Life''s Special Moments', 'From intimate gatherings to grand celebrations, we handle every detail.', 'View All Events', '/events'),
  ('services', 'Our Services', 'Everything You Need for a Perfect Event', 'Comprehensive event solutions tailored to your needs.', 'Learn More', '#services'),
  ('gallery', 'Our Gallery', 'Capturing Beautiful Memories', 'Take a look at our recent work and see the magic we create.', 'View Gallery', '/gallery'),
  ('partners', 'Our Partners', 'Trusted Venues & Collaborators', 'We work with the finest venues and partners to deliver exceptional experiences.', 'View Partners', '/collaborations'),
  ('testimonials', 'What Our Clients Say', 'Trusted by Hundreds of Happy Clients', 'Don''t just take our word for it - hear from those who''ve experienced our service.', NULL, NULL),
  ('why-us', 'Why Choose Us', 'Excellence in Every Detail', 'We combine creativity, expertise, and dedication to make your event unforgettable.', 'Contact Us', '/contact')
ON CONFLICT (section_key) DO NOTHING;
