-- Add admin user via SQL: creates auth user + admin_users row.
-- Run: SELECT add_admin_user_via_sql('email@example.com', 'Display Name', 'admin@123');
-- User can then log in with email + password, and must change password on first login.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure must_change_password column exists (for "change password on first login")
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION add_admin_user_via_sql(
  p_email TEXT,
  p_name TEXT,
  p_password TEXT DEFAULT 'admin@123'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Check if email already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email)) LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with email % already exists. Use a different email or have them sign in.', p_email;
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'::text));

  -- 1. Insert into auth.users
  -- Set all string columns GoTrue scans to '' to avoid "converting NULL to string" errors
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    v_encrypted_pw,
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', nullif(trim(p_name), '')),
    now(),
    now()
  );

  -- 2. Insert into auth.identities (required for email sign-in)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', lower(trim(p_email))
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- 3. Insert into admin_users (with must_change_password = true)
  INSERT INTO public.admin_users (id, email, name, role, must_change_password)
  VALUES (
    v_user_id,
    lower(trim(p_email)),
    COALESCE(nullif(trim(p_name), ''), split_part(lower(trim(p_email)), '@', 1)),
    'admin',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    must_change_password = true;

  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION add_admin_user_via_sql IS 'Add admin user via SQL. Creates auth user + admin_users. User logs in with email + password, must change password on first login.';
