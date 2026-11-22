import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Bell, Shield, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  fetchRemoteAppVersion,
  getNativeAppBuild,
  isNativeAdminApp,
  type RemoteAppVersion,
} from '@/lib/adminNative';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';

/**
 * Runs only inside the Capacitor Android shell.
 * - After login: permission gate (notifications + storage hint)
 * - Registers FCM token when plugin/Firebase is available
 * - Shows in-app "Update available" when version.json is newer than installed APK
 */
export default function AdminNativeBootstrap() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAdmin();
  const [update, setUpdate] = useState<RemoteAppVersion | null>(null);
  const [showPerms, setShowPerms] = useState(false);
  const [permBusy, setPermBusy] = useState(false);
  const askedRef = useRef(false);
  const native = isNativeAdminApp();

  const registerPush = useCallback(async () => {
    if (!native || !user?.id) return false;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') {
        toast.message('Notifications blocked', {
          description: 'Enable notifications in Android settings for Phoenix Admin.',
        });
        return false;
      }

      await PushNotifications.register();

      await PushNotifications.addListener('registration', async (token) => {
        const fcmToken = token.value;
        if (!fcmToken) return;
        const { error } = await supabase.from('admin_fcm_devices').upsert(
          {
            user_id: user.id,
            token: fcmToken,
            platform: 'android',
            app_id: 'com.phoenixevents.admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' },
        );
        if (error) {
          console.warn('Failed to save FCM token', error);
        } else {
          toast.success('Phone alerts enabled for this app');
        }
      });

      await PushNotifications.addListener('registrationError', (err) => {
        console.warn('Push registration error', err);
        toast.message('Push setup incomplete', {
          description:
            'Add google-services.json from Firebase to the Android project, then rebuild the APK.',
        });
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        const data = event.notification.data as { url?: string; path?: string } | undefined;
        const target = data?.path || data?.url;
        if (target && typeof target === 'string') {
          window.location.href = target.startsWith('http')
            ? target
            : `${window.location.origin}${target}`;
        }
      });

      return true;
    } catch (e) {
      console.warn('Native push unavailable', e);
      return false;
    }
  }, [native, user?.id]);

  const handleAllowPermissions = useCallback(async () => {
    setPermBusy(true);
    try {
      await registerPush();
      toast.message('Storage access', {
        description:
          'When you upload photos from the dashboard, Android will ask for media access as needed.',
        duration: 4500,
      });
      setShowPerms(false);
      try {
        localStorage.setItem('phoenix_admin_native_perms_v1', '1');
      } catch {
        /* ignore */
      }
    } finally {
      setPermBusy(false);
    }
  }, [registerPush]);

  // After login inside the app: show permissions sheet once.
  useEffect(() => {
    if (!native || !isAuthenticated || !pathname.startsWith('/admin')) return;
    if (askedRef.current) return;
    askedRef.current = true;

    let already = false;
    try {
      already = localStorage.getItem('phoenix_admin_native_perms_v1') === '1';
    } catch {
      already = false;
    }

    const timer = window.setTimeout(() => {
      if (already) {
        void registerPush();
      } else {
        setShowPerms(true);
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [native, isAuthenticated, pathname, registerPush]);

  // Version check for APK updates
  useEffect(() => {
    if (!native) return;
    void (async () => {
      const remote = await fetchRemoteAppVersion();
      const local = await getNativeAppBuild();
      if (!remote || !local) return;
      if (remote.versionCode > local.versionCode) {
        setUpdate(remote);
      }
    })();
  }, [native, pathname]);

  if (!native) return null;

  return (
    <>
      {showPerms ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <p className="text-base font-semibold">Allow app permissions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Phoenix Admin needs these so alerts and media uploads work on your phone.
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Notifications</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    New inquiries and OTP access requests while the app is closed.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Photos &amp; storage</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Asked by Android when you pick images to upload in the dashboard.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Secure admin session</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Same login as the web dashboard. Live updates load automatically.
                  </span>
                </span>
              </li>
            </ul>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" disabled={permBusy} onClick={() => void handleAllowPermissions()}>
                {permBusy ? 'Requesting…' : 'Allow & continue'}
              </Button>
              <Button
                variant="ghost"
                disabled={permBusy}
                onClick={() => {
                  setShowPerms(false);
                  try {
                    localStorage.setItem('phoenix_admin_native_perms_v1', '1');
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {update ? (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-[60] px-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
          <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
            <p className="text-sm font-semibold">Update available</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Version {update.versionName} is ready. Install to get the latest app shell.
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" className="flex-1 gap-1.5">
                <a href={update.apkUrl} download={`phoenix-admin-${update.versionName}.apk`}>
                  <Download className="h-3.5 w-3.5" />
                  Update app
                </a>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setUpdate(null)}>
                Later
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
