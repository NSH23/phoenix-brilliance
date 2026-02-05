-- SQL Queries for Collaborations Page Hero Content
-- This file contains queries to manage the collaborations page hero content and stats

-- 1. Insert default collaborations page hero content (if it doesn't exist)
INSERT INTO page_hero_content (page_key, title, subtitle, description, stats)
VALUES (
  'collaborations',
  'Our Network',
  'Trusted Collaborations',
  'We partner with the finest venues and vendors to deliver exceptional experiences for your special occasions.',
  '[
    {"value": "25+", "label": "Partner Venues"},
    {"value": "100+", "label": "Events Together"},
    {"value": "50K+", "label": "Happy Guests"}
  ]'::jsonb
)
ON CONFLICT (page_key) DO NOTHING;

-- 2. Update collaborations page hero content (title, subtitle, description)
UPDATE page_hero_content
SET 
  title = 'Our Network',  -- Change this value
  subtitle = 'Trusted Collaborations',  -- Change this value
  description = 'We partner with the finest venues and vendors to deliver exceptional experiences for your special occasions.',  -- Change this value
  updated_at = NOW()
WHERE page_key = 'collaborations';

-- 3. Update collaborations page stats (all 3 stats at once)
UPDATE page_hero_content
SET 
  stats = '[
    {"value": "25+", "label": "Partner Venues"},
    {"value": "100+", "label": "Events Together"},
    {"value": "50K+", "label": "Happy Guests"}
  ]'::jsonb,
  updated_at = NOW()
WHERE page_key = 'collaborations';

-- 4. Update a specific stat by index (example: update first stat)
UPDATE page_hero_content
SET 
  stats = jsonb_set(
    stats,
    '{0}',
    '{"value": "30+", "label": "Partner Venues"}'::jsonb
  ),
  updated_at = NOW()
WHERE page_key = 'collaborations';

-- 5. Update second stat (index 1)
UPDATE page_hero_content
SET 
  stats = jsonb_set(
    stats,
    '{1}',
    '{"value": "150+", "label": "Events Together"}'::jsonb
  ),
  updated_at = NOW()
WHERE page_key = 'collaborations';

-- 6. Update third stat (index 2)
UPDATE page_hero_content
SET 
  stats = jsonb_set(
    stats,
    '{2}',
    '{"value": "75K+", "label": "Happy Guests"}'::jsonb
  ),
  updated_at = NOW()
WHERE page_key = 'collaborations';

-- 7. View current collaborations page hero content
SELECT 
  id,
  page_key,
  title,
  subtitle,
  description,
  stats,
  created_at,
  updated_at
FROM page_hero_content
WHERE page_key = 'collaborations';

-- 8. Delete collaborations page hero content (use with caution)
-- DELETE FROM page_hero_content WHERE page_key = 'collaborations';

-- 9. Upsert (insert or update) collaborations page hero content
INSERT INTO page_hero_content (page_key, title, subtitle, description, stats)
VALUES (
  'collaborations',
  'Our Network',
  'Trusted Collaborations',
  'We partner with the finest venues and vendors to deliver exceptional experiences for your special occasions.',
  '[
    {"value": "25+", "label": "Partner Venues"},
    {"value": "100+", "label": "Events Together"},
    {"value": "50K+", "label": "Happy Guests"}
  ]'::jsonb
)
ON CONFLICT (page_key) 
DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  stats = EXCLUDED.stats,
  updated_at = NOW();

-- 10. Update only title
UPDATE page_hero_content
SET title = 'Your New Title', updated_at = NOW()
WHERE page_key = 'collaborations';

-- 11. Update only subtitle
UPDATE page_hero_content
SET subtitle = 'Your New Subtitle', updated_at = NOW()
WHERE page_key = 'collaborations';

-- 12. Update only description
UPDATE page_hero_content
SET description = 'Your new description text here.', updated_at = NOW()
WHERE page_key = 'collaborations';
