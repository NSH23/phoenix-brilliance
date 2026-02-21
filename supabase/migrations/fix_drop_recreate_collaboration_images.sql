-- ============================================
-- DROP AND RECREATE collaboration_images
-- Run in Supabase SQL Editor. THIS DELETES ALL COLLABORATION IMAGES.
-- Run fix_1_collaboration_folders_table.sql first if collaboration_folders doesn't exist.
-- ============================================

-- 1. Drop existing table (and its RLS policies)
DROP TABLE IF EXISTS collaboration_images CASCADE;

-- 2. Recreate with correct schema (folder_id references collaboration_folders, nullable)
CREATE TABLE collaboration_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES collaboration_folders(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collaboration_images_collaboration_id ON collaboration_images(collaboration_id);
CREATE INDEX idx_collaboration_images_folder_id ON collaboration_images(folder_id);
CREATE INDEX idx_collaboration_images_display_order ON collaboration_images(collaboration_id, display_order);

-- 3. RLS
ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view collaboration images"
  ON collaboration_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can manage collaboration images"
  ON collaboration_images FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
