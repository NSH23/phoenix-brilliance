-- ============================================
-- Fix 409 on collaboration_images: use SECURITY DEFINER to check admin
-- ============================================
-- The policy "(auth.uid()) IN (SELECT id FROM admin_users)" runs that SELECT
-- under RLS on admin_users. If the user can't read admin_users (e.g. strict
-- RLS), the subquery returns no rows and the policy fails → 409.
-- This migration uses a SECURITY DEFINER function so the check bypasses RLS.
-- Run this in Supabase SQL Editor.
-- ============================================

-- 1. Ensure the helper exists and bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$;

-- 2. Replace the policy so it uses the function instead of a subquery
DROP POLICY IF EXISTS "Admins can manage collaboration images" ON collaboration_images;

CREATE POLICY "Admins can manage collaboration images"
  ON collaboration_images FOR ALL
  USING (public.is_admin_or_moderator_user((SELECT auth.uid())))
  WITH CHECK (public.is_admin_or_moderator_user((SELECT auth.uid())));
