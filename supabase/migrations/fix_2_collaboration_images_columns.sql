-- ============================================
-- FIX 2: Add folder_id and media_type to collaboration_images (if missing)
-- Run this second in Supabase SQL Editor.
-- ============================================

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
