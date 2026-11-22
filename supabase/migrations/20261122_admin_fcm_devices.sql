-- Android APK FCM device tokens for Phoenix Admin (Capacitor shell).
-- Idempotent: table may already exist from an earlier apply.

CREATE TABLE IF NOT EXISTS public.admin_fcm_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  app_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_fcm_devices_user_id_idx
  ON public.admin_fcm_devices (user_id);

ALTER TABLE public.admin_fcm_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_fcm_devices_select_own ON public.admin_fcm_devices;
CREATE POLICY admin_fcm_devices_select_own
  ON public.admin_fcm_devices
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

DROP POLICY IF EXISTS admin_fcm_devices_insert_own ON public.admin_fcm_devices;
CREATE POLICY admin_fcm_devices_insert_own
  ON public.admin_fcm_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

DROP POLICY IF EXISTS admin_fcm_devices_update_own ON public.admin_fcm_devices;
CREATE POLICY admin_fcm_devices_update_own
  ON public.admin_fcm_devices
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

DROP POLICY IF EXISTS admin_fcm_devices_delete_own ON public.admin_fcm_devices;
CREATE POLICY admin_fcm_devices_delete_own
  ON public.admin_fcm_devices
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

COMMENT ON TABLE public.admin_fcm_devices IS 'FCM tokens for Phoenix Admin Android APK; populated after login + permission grant.';
