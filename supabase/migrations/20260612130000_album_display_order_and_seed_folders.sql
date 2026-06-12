-- Album list ordering (per event) + standard folder seed for album galleries

ALTER TABLE event_albums
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_event_albums_display_order ON event_albums(event_id, display_order);

-- Backfill display order within each event
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id
      ORDER BY is_featured DESC, event_date DESC NULLS LAST, created_at DESC
    ) - 1 AS rn
  FROM event_albums
)
UPDATE event_albums ea
SET display_order = ranked.rn
FROM ranked
WHERE ea.id = ranked.id;

-- Standard folder tree for album galleries (mirrors venue seed)
CREATE OR REPLACE FUNCTION public.seed_album_folders(p_album_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_id UUID; b_id UUID; a_id UUID; cor_id UUID; bs_id UUID; pw_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM album_folders WHERE album_id = p_album_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled)
  VALUES (p_album_id, NULL, 'Wedding', 0, false)
  RETURNING id INTO w_id;
  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled) VALUES
    (p_album_id, w_id, 'Haldi', 0, false),
    (p_album_id, w_id, 'Mehendi', 1, false),
    (p_album_id, w_id, 'Engagement', 2, false),
    (p_album_id, w_id, 'Sangeet', 3, false),
    (p_album_id, w_id, 'Reception', 4, false),
    (p_album_id, w_id, 'Cocktail', 5, false);

  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled)
  VALUES (p_album_id, NULL, 'Birthday', 1, false)
  RETURNING id INTO b_id;
  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled) VALUES
    (p_album_id, b_id, 'Party', 0, false),
    (p_album_id, b_id, 'Cake cutting', 1, false);

  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled)
  VALUES (p_album_id, NULL, 'Anniversary', 2, false)
  RETURNING id INTO a_id;
  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled) VALUES
    (p_album_id, a_id, 'Party', 0, false),
    (p_album_id, a_id, 'Renewal', 1, false);

  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled)
  VALUES (p_album_id, NULL, 'Corporate', 3, false)
  RETURNING id INTO cor_id;
  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled) VALUES
    (p_album_id, cor_id, 'Conference', 0, false),
    (p_album_id, cor_id, 'Team building', 1, false);

  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled)
  VALUES (p_album_id, NULL, 'Baby Shower', 4, false)
  RETURNING id INTO bs_id;
  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled) VALUES
    (p_album_id, bs_id, 'Games', 0, false),
    (p_album_id, bs_id, 'Cake cutting', 1, false);

  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled)
  VALUES (p_album_id, NULL, 'Pre-wedding', 5, false)
  RETURNING id INTO pw_id;
  INSERT INTO album_folders (album_id, parent_id, name, display_order, is_enabled) VALUES
    (p_album_id, pw_id, 'Engagement', 0, false),
    (p_album_id, pw_id, 'Cocktail', 1, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_album_folders(UUID) TO authenticated;
