-- ============================================
-- collaboration_images: separate RLS policies (fix 409 on INSERT/UPDATE)
-- ============================================
-- 1. Drop ALL existing policies on this table.
-- 2. Create a SECURITY DEFINER helper so the check does not depend on admin_users RLS.
-- 3. Create four separate policies: SELECT (public), INSERT, UPDATE, DELETE (admin only).
-- Run in Supabase SQL Editor.
-- ============================================

-- ---------- Step 1: Remove every existing policy ----------
DROP POLICY IF EXISTS "Public can view collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can manage collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Authenticated can manage collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can insert collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can update collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Admins can delete collaboration images" ON collaboration_images;
DROP POLICY IF EXISTS "Public and admins can view collaboration images" ON collaboration_images;

-- ---------- Step 2: Helper (bypasses RLS on admin_users) ----------
-- Returns true if the user has any row in admin_users (any role).
CREATE OR REPLACE FUNCTION public.user_is_collaboration_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = check_user_id
  );
END;
$$;

-- ---------- Step 3: RLS on ----------
ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;

-- ---------- Step 4: Separate policies ----------

-- Policy 1: Anyone can read
CREATE POLICY "collab_images_select_public"
  ON collaboration_images
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Only admin users can insert
CREATE POLICY "collab_images_insert_admin"
  ON collaboration_images
  FOR INSERT
  TO public
  WITH CHECK (public.user_is_collaboration_admin((SELECT auth.uid())));

-- Policy 3: Only admin users can update
CREATE POLICY "collab_images_update_admin"
  ON collaboration_images
  FOR UPDATE
  TO public
  USING (public.user_is_collaboration_admin((SELECT auth.uid())))
  WITH CHECK (public.user_is_collaboration_admin((SELECT auth.uid())));

-- Policy 4: Only admin users can delete
CREATE POLICY "collab_images_delete_admin"
  ON collaboration_images
  FOR DELETE
  TO public
  USING (public.user_is_collaboration_admin((SELECT auth.uid())));
