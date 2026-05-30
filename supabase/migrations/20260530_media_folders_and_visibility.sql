-- Folder cover images for venue galleries
ALTER TABLE collaboration_folders
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Album visibility on public site
ALTER TABLE event_albums
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Album folder tree (mirrors collaboration_folders)
CREATE TABLE IF NOT EXISTS album_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES event_albums(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES album_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_album_folders_album_id ON album_folders(album_id);
CREATE INDEX IF NOT EXISTS idx_album_folders_parent_id ON album_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_album_folders_display_order ON album_folders(album_id, display_order);

ALTER TABLE album_media
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES album_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_album_media_folder_id ON album_media(folder_id);

ALTER TABLE album_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view album folders" ON album_folders;
CREATE POLICY "Public can view album folders"
  ON album_folders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert album folders" ON album_folders;
CREATE POLICY "Authenticated can insert album folders"
  ON album_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update album folders" ON album_folders;
CREATE POLICY "Authenticated can update album folders"
  ON album_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete album folders" ON album_folders;
CREATE POLICY "Authenticated can delete album folders"
  ON album_folders FOR DELETE
  TO authenticated
  USING (true);

GRANT SELECT ON public.album_folders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.album_folders TO authenticated;
