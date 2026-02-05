-- ============================================
-- Event Images & Homepage Events Settings
-- ============================================
-- Run this in Supabase SQL Editor
-- Adds event_images table for 3-5 images per event (homepage display)
-- and site settings for homepage events limit and frame template

-- 1. EVENT IMAGES TABLE (3-5 images per event for homepage)
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_display_order ON event_images(event_id, display_order);

ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event images"
  ON event_images FOR SELECT
  USING (
    event_id IN (SELECT id FROM events WHERE is_active = true)
  );

CREATE POLICY "Admins can manage event images"
  ON event_images FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_event_images_updated_at
  BEFORE UPDATE ON event_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Site settings for homepage events section
INSERT INTO site_settings (key, value, type)
VALUES
  ('homepage_events_limit', '5', 'number'),
  ('homepage_events_frame_template', 'polaroid', 'text')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type;
