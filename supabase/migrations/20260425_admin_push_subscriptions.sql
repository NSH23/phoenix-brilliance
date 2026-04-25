-- Admin Web Push: store browser PushSubscription rows per authenticated admin.
-- Sending is done by Edge Function (service role) on inquiry INSERT webhook.

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  subscription jsonb NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_push_subscriptions_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS admin_push_subscriptions_user_id_idx
  ON public.admin_push_subscriptions (user_id);

ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Authenticated users in admin_users may manage only their own rows.
CREATE POLICY admin_push_subscriptions_select_own
  ON public.admin_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

CREATE POLICY admin_push_subscriptions_insert_own
  ON public.admin_push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

CREATE POLICY admin_push_subscriptions_update_own
  ON public.admin_push_subscriptions
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

CREATE POLICY admin_push_subscriptions_delete_own
  ON public.admin_push_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid())
  );

COMMENT ON TABLE public.admin_push_subscriptions IS 'Web Push subscriptions for admin PWA; populated by client after permission granted.';
