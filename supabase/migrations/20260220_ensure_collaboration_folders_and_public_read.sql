-- ============================================
-- Ensure collaboration_folders exists and public can read folders + images
-- Run this in Supabase SQL Editor if folders don't show on the public collaboration page.
-- ============================================

-- 1. Create collaboration_folders table if it doesn't exist
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

-- 2. Add folder_id and media_type to collaboration_images if missing
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

-- 3. RLS on collaboration_folders: allow public (anon) to SELECT so the public page can show folders
ALTER TABLE collaboration_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view collaboration folders" ON collaboration_folders;
CREATE POLICY "Public can view collaboration folders"
  ON collaboration_folders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage collaboration folders" ON collaboration_folders;
DROP POLICY IF EXISTS "Authenticated can manage collaboration folders" ON collaboration_folders;
CREATE POLICY "Authenticated can manage collaboration folders"
  ON collaboration_folders FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Ensure collaboration_images is readable by public (anon) so gallery images show on public page
ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view collaboration images" ON collaboration_images;
CREATE POLICY "Public can view collaboration images"
  ON collaboration_images FOR SELECT
  USING (true);
