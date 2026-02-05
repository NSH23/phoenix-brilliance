# Remaining Security Issues - Fix Explanation

## Overview

This document explains how to fix the remaining **8 security warnings**.

---

## Issues Breakdown

### 1. Function Search Path Mutable (6 functions) ✅ SQL Fix

**Problem:** Functions don't have `SET search_path` specified, making them vulnerable to search_path injection attacks.

**Risk:** An attacker could manipulate the `search_path` to make functions reference malicious schemas instead of the intended ones.

**Fix:** Add `SET search_path = public, pg_temp` to all functions.

**Functions Fixed:**
- ✅ `is_admin_user`
- ✅ `is_admin_or_moderator_user`
- ✅ `create_admin_user`
- ✅ `update_updated_at_column`
- ✅ `is_admin`
- ✅ `is_admin_or_moderator`

**Example:**
```sql
-- Before (vulnerable)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE ...);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- After (secure)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE ...);
END;
$$;
```

---

### 2. RLS Policy Always True (1 policy) ✅ SQL Fix

**Problem:** The `inquiries` INSERT policy uses `WITH CHECK (true)`, which allows unrestricted access.

**Risk:** No validation on inserted data, potentially allowing invalid or malicious data.

**Fix:** Replace `WITH CHECK (true)` with proper validation:
- Required fields must be present and non-empty
- Email format validation
- Status value validation

**Policy Fixed:**
- ✅ `inquiries` table - "Public and admins can create inquiries"

**Example:**
```sql
-- Before (overly permissive)
CREATE POLICY "Public and admins can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- After (properly validated)
CREATE POLICY "Public and admins can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (
    name IS NOT NULL AND LENGTH(TRIM(name)) > 0
    AND email IS NOT NULL AND LENGTH(TRIM(email)) > 0
    AND message IS NOT NULL AND LENGTH(TRIM(message)) > 0
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (status IS NULL OR status IN ('new', 'contacted', 'converted', 'closed'))
  );
```

---

### 3. Leaked Password Protection Disabled (1 setting) ⚠️ Manual Fix

**Problem:** Supabase Auth's leaked password protection is disabled.

**Risk:** Users can set passwords that have been compromised in data breaches.

**Fix:** Enable in Supabase Dashboard (cannot be done via SQL).

**Steps:**
1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Find **"Password Security"** section
4. Enable **"Leaked Password Protection"**
5. This checks passwords against HaveIBeenPwned.org database

**What it does:**
- Checks user passwords against HaveIBeenPwned.org database
- Prevents users from using compromised passwords
- Enhances overall security

---

## How to Apply Fixes

### Step 1: Run SQL Fix Script

1. Open **Supabase SQL Editor**
2. Copy entire `fix-remaining-security-issues.sql` file
3. Paste and run in SQL Editor
4. Verify no errors appear

### Step 2: Enable Leaked Password Protection (Manual)

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Settings**
3. Scroll to **"Password Security"** section
4. Toggle **"Leaked Password Protection"** to **ON**
5. Save changes

---

## Verification

After applying fixes, verify:

### Check Functions:
```sql
-- Verify search_path is set
SELECT 
  proname as function_name,
  proconfig as config_settings
FROM pg_proc
WHERE proname IN (
  'is_admin_user',
  'is_admin_or_moderator_user',
  'create_admin_user',
  'update_updated_at_column',
  'is_admin',
  'is_admin_or_moderator'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

### Check RLS Policy:
```sql
-- Verify inquiries policy has proper validation
SELECT 
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'inquiries'
  AND cmd = 'INSERT';
```

---

## Functionality Preserved

✅ **All functions:** Work exactly the same  
✅ **Public users:** Can still create inquiries (with validation)  
✅ **Admins:** Can still manage all content  
✅ **No breaking changes**

---

## Security Improvements

### Before:
- ❌ Functions vulnerable to search_path injection
- ❌ No validation on inquiry submissions
- ❌ Compromised passwords allowed

### After:
- ✅ Functions protected against search_path injection
- ✅ Proper validation on inquiry submissions
- ✅ Compromised passwords blocked (after manual enable)

---

## Summary

**Total Issues:** 8  
**SQL Fixes:** 7 ✅  
**Manual Fixes:** 1 ⚠️  

**Files:**
- `fix-remaining-security-issues.sql` - Run this in SQL Editor
- `SECURITY_FIXES_EXPLANATION.md` - This file

**Estimated Time:**
- SQL fixes: 1 minute
- Manual dashboard config: 2 minutes
- **Total: ~3 minutes**
