-- Allow PNG and other common image MIME types for gallery-images bucket.
-- Fixes: "mime type image/png is not supported" when uploading to gallery-images.
-- Run in Supabase SQL Editor if the bucket already exists with a restrictive list.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]
WHERE id = 'gallery-images';
