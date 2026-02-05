-- ============================================
-- Fix Admin Users RLS Policies
-- ============================================
-- IMPORTANT: This script MUST be run in your Supabase SQL Editor
-- 
-- This fixes two issues:
-- 1. Infinite recursion in admin_users RLS policies
-- 2. Missing INSERT policy that prevents user signup
--
-- Without this fix, users cannot sign up because inserts into admin_users
-- will be blocked by Row Level Security.
--
-- To run:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" or press Ctrl+Enter
-- 4. Verify success message appears
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- Create a security definer function to check admin status
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION is_admin_or_moderator_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can view their own admin record
CREATE POLICY "Users can view own admin record"
  ON admin_users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can view all admin users (using function to avoid recursion)
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Policy: Users can insert their own admin record (for signup)
CREATE POLICY "Users can insert own admin record"
  ON admin_users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own admin record
CREATE POLICY "Users can update own admin record"
  ON admin_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can update any admin user
CREATE POLICY "Admins can update any admin user"
  ON admin_users FOR UPDATE
  USING (is_admin_user(auth.uid()));

-- Policy: Admins can delete admin users
CREATE POLICY "Admins can delete admin users"
  ON admin_users FOR DELETE
  USING (is_admin_user(auth.uid()));

-- ============================================
-- Helper function to create admin user (bypasses RLS)
-- ============================================
-- This function can be used as a fallback if RLS policies fail
CREATE OR REPLACE FUNCTION create_admin_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'moderator'
)
RETURNS admin_users AS $$
DECLARE
  new_admin_user admin_users;
BEGIN
  INSERT INTO admin_users (id, email, name, role)
  VALUES (user_id, user_email, user_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role
  RETURNING * INTO new_admin_user;
  
  RETURN new_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update other policies to use the function
-- ============================================

-- Update events policies
DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update event_steps policies
DROP POLICY IF EXISTS "Admins can manage event steps" ON event_steps;
CREATE POLICY "Admins can manage event steps"
  ON event_steps FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update event_albums policies
DROP POLICY IF EXISTS "Admins can manage albums" ON event_albums;
CREATE POLICY "Admins can manage albums"
  ON event_albums FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update album_media policies
DROP POLICY IF EXISTS "Admins can manage album media" ON album_media;
CREATE POLICY "Admins can manage album media"
  ON album_media FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update gallery policies
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;
CREATE POLICY "Admins can manage gallery"
  ON gallery FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update collaborations policies
DROP POLICY IF EXISTS "Admins can manage collaborations" ON collaborations;
CREATE POLICY "Admins can manage collaborations"
  ON collaborations FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update collaboration_images policies
DROP POLICY IF EXISTS "Admins can manage collaboration images" ON collaboration_images;
CREATE POLICY "Admins can manage collaboration images"
  ON collaboration_images FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update collaboration_steps policies
DROP POLICY IF EXISTS "Admins can manage collaboration steps" ON collaboration_steps;
CREATE POLICY "Admins can manage collaboration steps"
  ON collaboration_steps FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update services policies
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update testimonials policies
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;
CREATE POLICY "Admins can manage testimonials"
  ON testimonials FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update inquiries policies
DROP POLICY IF EXISTS "Admins can manage inquiries" ON inquiries;
CREATE POLICY "Admins can manage inquiries"
  ON inquiries FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update site_content policies
DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;
CREATE POLICY "Admins can manage site content"
  ON site_content FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update site_settings policies
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update social_links policies
DROP POLICY IF EXISTS "Admins can manage social links" ON social_links;
CREATE POLICY "Admins can manage social links"
  ON social_links FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- Update contact_info policies
DROP POLICY IF EXISTS "Admins can manage contact info" ON contact_info;
CREATE POLICY "Admins can manage contact info"
  ON contact_info FOR ALL
  USING (is_admin_or_moderator_user(auth.uid()));

-- ============================================
-- Verification
-- ============================================
-- Run this query to verify the policies were created successfully:
-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   permissive, 
--   roles, 
--   cmd, 
--   qual, 
--   with_check
-- FROM pg_policies 
-- WHERE tablename = 'admin_users'
-- ORDER BY policyname;

-- You should see these policies:
-- - "Users can view own admin record" (SELECT)
-- - "Admins can view all admin users" (SELECT)
-- - "Users can insert own admin record" (INSERT) ← This is critical for signup!
-- - "Users can update own admin record" (UPDATE)
-- - "Admins can update any admin user" (UPDATE)
-- - "Admins can delete admin users" (DELETE)

-- ============================================
-- Notes
-- ============================================
-- The SECURITY DEFINER functions bypass RLS, preventing infinite recursion
-- Users can now:
-- 1. Insert their own admin_users record during signup
-- 2. View their own admin_users record
-- 3. Admins can view/manage all admin_users records
-- 4. All admin operations use the helper functions to avoid recursion
--
-- The create_admin_user() function provides a fallback mechanism if RLS
-- policies still cause issues, but the policies above should work correctly.
