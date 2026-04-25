import type { SupabaseClient } from '@supabase/supabase-js';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getAdminVapidPublicKey(): string | undefined {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  return k?.trim() || undefined;
}

/**
 * Subscribe this browser for Web Push and upsert to admin_push_subscriptions.
 * Call only after Notification.permission === 'granted' and service worker is registered.
 */
export async function syncAdminPushSubscription(
  supabase: SupabaseClient,
  registration: ServiceWorkerRegistration
): Promise<{ ok: true } | { ok: false; message: string }> {
  const vapidKey = getAdminVapidPublicKey();
  if (!vapidKey) {
    return { ok: false, message: 'VITE_VAPID_PUBLIC_KEY is not set in the app environment.' };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, message: 'You must be signed in to enable push alerts.' };
  }

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to subscribe for push.';
    return { ok: false, message: msg };
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys) {
    return { ok: false, message: 'Invalid push subscription from browser.' };
  }

  const { error } = await supabase.from('admin_push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: json.endpoint,
      subscription: json as unknown as Record<string, unknown>,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    return { ok: false, message: error.message || 'Failed to save push subscription.' };
  }

  return { ok: true };
}
