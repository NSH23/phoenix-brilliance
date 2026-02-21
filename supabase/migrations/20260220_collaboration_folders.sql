-- ============================================
-- Collaboration folders and subfolders for gallery
-- ============================================
-- Run this in Supabase SQL Editor or via supabase db push.
-- Adds: collaboration_folders table, folder_id + media_type on collaboration_images.

-- 1. Create collaboration_folders (parent_id = null means root folder, e.g. "Wedding")
CREATE TABLE IF NOT EXISTS collaboration_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES collaboration_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collaboration_folders_collaboration_id ON collaboration_folders(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_folders_parent_id ON collaboration_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_folders_display_order ON collaboration_folders(collaboration_id, display_order);

-- 2. Add folder_id and media_type to collaboration_images (if columns don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collaboration_images' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE collaboration_images ADD COLUMN folder_id UUID REFERENCES collaboration_folders(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_collaboration_images_folder_id ON collaboration_images(folder_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collaboration_images' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE collaboration_images ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;

-- 3. RLS for collaboration_folders (public read; admin write via service role)
ALTER TABLE collaboration_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view collaboration folders"
  ON collaboration_folders FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage collaboration folders"
  ON collaboration_folders FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. collaboration_images: ensure public read and allow admin (authenticated/service_role) to insert/update/delete
ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view collaboration images" ON collaboration_images;
CREATE POLICY "Public can view collaboration images" ON collaboration_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage collaboration images" ON collaboration_images;
CREATE POLICY "Authenticated can manage collaboration images" ON collaboration_images FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
