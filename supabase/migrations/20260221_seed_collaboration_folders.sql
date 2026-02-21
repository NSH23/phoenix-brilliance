-- ============================================
-- Seed collaboration_folders with standard event folders/subfolders
-- Admin can enable/disable which folders to show; images go into these folders.
-- ============================================

-- 1. is_enabled: default OFF so admin enables only what they need
ALTER TABLE collaboration_folders
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE collaboration_folders ALTER COLUMN is_enabled SET DEFAULT false;

-- 2. Function: insert standard folder tree for one collaboration (idempotent)
CREATE OR REPLACE FUNCTION public.seed_collaboration_folders(p_collaboration_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_id UUID; b_id UUID; a_id UUID; cor_id UUID; bs_id UUID; pw_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM collaboration_folders WHERE collaboration_id = p_collaboration_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- All folders created with is_enabled = false; admin enables what they need
  -- Wedding (root order 0)
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled)
  VALUES (p_collaboration_id, NULL, 'Wedding', 0, false)
  RETURNING id INTO w_id;
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled) VALUES
    (p_collaboration_id, w_id, 'Haldi', 0, false),
    (p_collaboration_id, w_id, 'Mehendi', 1, false),
    (p_collaboration_id, w_id, 'Engagement', 2, false),
    (p_collaboration_id, w_id, 'Sangeet', 3, false),
    (p_collaboration_id, w_id, 'Reception', 4, false),
    (p_collaboration_id, w_id, 'Cocktail', 5, false);

  -- Birthday (root order 1)
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled)
  VALUES (p_collaboration_id, NULL, 'Birthday', 1, false)
  RETURNING id INTO b_id;
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled) VALUES
    (p_collaboration_id, b_id, 'Party', 0, false),
    (p_collaboration_id, b_id, 'Cake cutting', 1, false);

  -- Anniversary (root order 2)
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled)
  VALUES (p_collaboration_id, NULL, 'Anniversary', 2, false)
  RETURNING id INTO a_id;
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled) VALUES
    (p_collaboration_id, a_id, 'Party', 0, false),
    (p_collaboration_id, a_id, 'Renewal', 1, false);

  -- Corporate (root order 3)
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled)
  VALUES (p_collaboration_id, NULL, 'Corporate', 3, false)
  RETURNING id INTO cor_id;
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled) VALUES
    (p_collaboration_id, cor_id, 'Conference', 0, false),
    (p_collaboration_id, cor_id, 'Team building', 1, false);

  -- Baby Shower (root order 4)
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled)
  VALUES (p_collaboration_id, NULL, 'Baby Shower', 4, false)
  RETURNING id INTO bs_id;
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled) VALUES
    (p_collaboration_id, bs_id, 'Games', 0, false),
    (p_collaboration_id, bs_id, 'Cake cutting', 1, false);

  -- Pre-wedding (root order 5)
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled)
  VALUES (p_collaboration_id, NULL, 'Pre-wedding', 5, false)
  RETURNING id INTO pw_id;
  INSERT INTO collaboration_folders (collaboration_id, parent_id, name, display_order, is_enabled) VALUES
    (p_collaboration_id, pw_id, 'Engagement', 0, false),
    (p_collaboration_id, pw_id, 'Cocktail', 1, false);
END;
$$;

-- 3. Seed folders for all existing collaborations
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM collaborations LOOP
    PERFORM public.seed_collaboration_folders(r.id);
  END LOOP;
END;
$$;

-- 4. Trigger: when a new collaboration is created, seed its folders
CREATE OR REPLACE FUNCTION public.on_collaboration_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_collaboration_folders(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_seed_folders_on_collaboration_insert ON collaborations;
CREATE TRIGGER trigger_seed_folders_on_collaboration_insert
  AFTER INSERT ON collaborations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_collaboration_insert();

-- 5. Allow authenticated users to call seed (e.g. admin "Create standard folders" button)
GRANT EXECUTE ON FUNCTION public.seed_collaboration_folders(UUID) TO authenticated;
