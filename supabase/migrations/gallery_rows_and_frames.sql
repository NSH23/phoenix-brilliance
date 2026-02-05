-- ============================================
-- Gallery Rows & Frame Templates Migration
-- ============================================
-- Run this in Supabase SQL Editor to add row-based gallery support

-- 1. Add row_index to gallery table (groups images into rows)
ALTER TABLE gallery
ADD COLUMN IF NOT EXISTS row_index INTEGER NOT NULL DEFAULT 0;

-- Distribute existing images into 2 rows (first half → row 0, second half → row 1)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) as rn
  FROM gallery
),
total_count AS (
  SELECT COUNT(*)::int as cnt FROM gallery
)
UPDATE gallery g
SET row_index = CASE WHEN n.rn <= ((SELECT cnt FROM total_count) + 1) / 2 THEN 0 ELSE 1 END
FROM numbered n
WHERE g.id = n.id;

-- Indexes for efficient row-based queries
CREATE INDEX IF NOT EXISTS idx_gallery_row_index ON gallery(row_index);
CREATE INDEX IF NOT EXISTS idx_gallery_row_display ON gallery(row_index, display_order);

-- 2. Insert default site settings for frame template and images per row
INSERT INTO site_settings (key, value, type)
VALUES
  ('homepage_gallery_frame_template', 'polaroid', 'text'),
  ('homepage_gallery_images_per_row', '5', 'number')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type;
