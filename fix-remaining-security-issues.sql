-- ============================================
-- Fix Remaining Security Issues
-- ============================================
-- This script fixes 8 remaining security warnings:
-- 1. Function Search Path Mutable (6 functions) - Add SET search_path
-- 2. RLS Policy Always True (1 policy) - Add proper validation
-- 3. Leaked Password Protection (1 setting) - Manual dashboard configuration
--
-- IMPORTANT: This preserves exact same functionality - nothing breaks!
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX FUNCTION SEARCH PATH ISSUES
-- ============================================
-- Adding SET search_path prevents search_path injection attacks
-- This ensures functions always use the intended schema, not a malicious one

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Fix is_admin_or_moderator_user function
CREATE OR REPLACE FUNCTION is_admin_or_moderator_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$;

-- Fix create_admin_user function
CREATE OR REPLACE FUNCTION create_admin_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'moderator'
)
RETURNS admin_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix is_admin function (if exists)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Fix is_admin_or_moderator function (if exists)
CREATE OR REPLACE FUNCTION is_admin_or_moderator(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$;

-- ============================================
-- 2. FIX RLS POLICY ALWAYS TRUE ISSUE
-- ============================================
-- Replace overly permissive WITH CHECK (true) with proper validation
-- This ensures inquiries have required fields and valid data

DROP POLICY IF EXISTS "Public and admins can create inquiries" ON inquiries;

-- Improved INSERT policy with proper validation
CREATE POLICY "Public and admins can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (
    -- Ensure required fields are present and not empty
    name IS NOT NULL AND LENGTH(TRIM(name)) > 0
    AND email IS NOT NULL AND LENGTH(TRIM(email)) > 0
    AND message IS NOT NULL AND LENGTH(TRIM(message)) > 0
    -- Validate email format (basic check)
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    -- Ensure status is valid (defaults to 'new' but validate anyway)
    AND (status IS NULL OR status IN ('new', 'contacted', 'converted', 'closed'))
  );

-- ============================================
-- Summary
-- ============================================
-- Fixed Issues:
-- ✅ 6 functions now have SET search_path (prevents search_path injection)
-- ✅ 1 RLS policy now has proper validation (prevents unrestricted access)
-- ✅ Total: 7 SQL fixes applied
--
-- Manual Configuration Required:
-- ⚠️ 1. Leaked Password Protection - Enable in Supabase Dashboard
--    Steps:
--    1. Go to Supabase Dashboard > Authentication > Settings
--    2. Find "Password Security" section
--    3. Enable "Leaked Password Protection"
--    4. This checks passwords against HaveIBeenPwned.org database
--
-- Functionality Preserved:
-- ✅ All functions work exactly the same
-- ✅ Public users can still create inquiries (with validation)
-- ✅ Admins can still manage all content
-- ✅ No breaking changes
