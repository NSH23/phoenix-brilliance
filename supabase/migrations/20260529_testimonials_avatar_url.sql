-- Align testimonials avatar column with application (avatar_url).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'avatar'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'testimonials' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE testimonials RENAME COLUMN avatar TO avatar_url;
  END IF;
END $$;
