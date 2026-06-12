-- Remove duplicate venue/album gallery rows that share the same canonical media URL
-- within one venue/album. Keeps the oldest row (first upload); deletes later copies only.
-- Unique images in a single folder are never touched.

WITH normalized AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        collaboration_id,
        COALESCE(media_type, 'image'),
        lower(
          regexp_replace(
            trim(image_url),
            '/image/upload/v[0-9]+/',
            '/image/upload/'
          )
        )
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.collaboration_images
  WHERE image_url IS NOT NULL
    AND trim(image_url) <> ''
)
DELETE FROM public.collaboration_images ci
USING normalized n
WHERE ci.id = n.id
  AND n.rn > 1;

WITH normalized AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        album_id,
        COALESCE(type, 'image'),
        lower(
          regexp_replace(
            trim(COALESCE(url, youtube_url, '')),
            '/image/upload/v[0-9]+/',
            '/image/upload/'
          )
        )
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.album_media
  WHERE COALESCE(url, youtube_url) IS NOT NULL
    AND trim(COALESCE(url, youtube_url, '')) <> ''
)
DELETE FROM public.album_media am
USING normalized n
WHERE am.id = n.id
  AND n.rn > 1;
