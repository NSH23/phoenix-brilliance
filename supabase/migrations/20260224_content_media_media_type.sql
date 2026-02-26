-- Hero: 1 video (front) + 2 background images. Add media_type to support both.
ALTER TABLE content_media
ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'image'));

COMMENT ON COLUMN content_media.media_type IS 'For hero: display_order 0 = video, 1-2 = images. For moment: video.';
