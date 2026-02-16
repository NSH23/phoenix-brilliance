-- ============================================
-- Content Media Table (Hero Video & Reel Moments)
-- ============================================

CREATE TABLE IF NOT EXISTS content_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('hero', 'moment')),
  title TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_media_category ON content_media(category);
CREATE INDEX IF NOT EXISTS idx_content_media_active ON content_media(is_active);

-- Enable RLS
ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active content media
CREATE POLICY "Public can view active content media"
  ON content_media FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all content media
CREATE POLICY "Admins can manage content media"
  ON content_media FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Note: You must create a public bucket named 'content-media' in Supabase Dashboard first.

CREATE POLICY "Public can view content media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-media');

CREATE POLICY "Admins can upload content media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-media' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update content media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-media' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete content media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-media' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
