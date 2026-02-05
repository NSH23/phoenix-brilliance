-- ============================================
-- Verification Script for RLS Performance Fixes
-- ============================================
-- Run this AFTER applying fix-all-rls-performance-issues.sql
-- to verify all fixes were applied correctly
-- ============================================

-- 1. Check total policy count (should be reduced)
SELECT 
  'Total Policies' as check_type,
  COUNT(*) as count,
  'Should be reduced from original count' as note
FROM pg_policies
WHERE schemaname = 'public';

-- 2. Check for tables with multiple SELECT policies (should be minimal)
SELECT 
  tablename,
  COUNT(*) as select_policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
GROUP BY tablename
HAVING COUNT(*) > 1
ORDER BY select_policy_count DESC;

-- 3. Check for auth.uid() usage (should use (select auth.uid()) pattern)
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%auth.uid()%' AND qual::text NOT LIKE '%(select auth.uid())%' THEN 'NEEDS FIX'
    WHEN with_check::text LIKE '%auth.uid()%' AND with_check::text NOT LIKE '%(select auth.uid())%' THEN 'NEEDS FIX'
    ELSE 'OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%')
ORDER BY status DESC, tablename, policyname;

-- 4. Verify admin_users policies are correct
SELECT 
  'admin_users policies' as check_type,
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN qual::text LIKE '%(select auth.uid())%' OR with_check::text LIKE '%(select auth.uid())%' THEN '✅ Optimized'
    ELSE '⚠️ Check needed'
  END as optimization_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_users'
ORDER BY cmd, policyname;

-- 5. Check consolidated policies (should have "Public and admins" pattern)
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%Public and admins%' THEN '✅ Consolidated'
    WHEN policyname LIKE '%Admins can%' AND cmd != 'SELECT' THEN '✅ Admin only'
    ELSE '⚠️ Review'
  END as consolidation_status
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
ORDER BY tablename;

-- 6. Summary by table
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as all_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 7. Check for helper functions
SELECT 
  'Helper Functions' as check_type,
  proname as function_name,
  CASE 
    WHEN proname IN ('is_admin_user', 'is_admin_or_moderator_user') THEN '✅ Exists'
    ELSE '⚠️ Missing'
  END as status
FROM pg_proc
WHERE proname IN ('is_admin_user', 'is_admin_or_moderator_user')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================
-- Expected Results:
-- ============================================
-- 1. Total policies: Reduced (consolidated)
-- 2. Multiple SELECT policies: Minimal (only where needed)
-- 3. auth.uid() usage: All wrapped in (select auth.uid())
-- 4. admin_users: All policies optimized
-- 5. Consolidated policies: Most SELECT policies show "Public and admins"
-- 6. Helper functions: Both exist
-- ============================================
