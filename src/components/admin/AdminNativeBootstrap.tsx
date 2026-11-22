import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Bell, Shield, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  fetchRemoteAppVersion,
  getNativeAppBuild,
  isNativeAdminApp,
  resolveAbsoluteAdminUrl,
  type RemoteAppVersion,
} from '@/lib/adminNative';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';

const PERMS_FLAG = 'phoenix_admin_native_perms_v1';
const FCM_CHANNEL_ID = 'phoenix_admin';

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
  const listenersReadyRef = useRef(false);
  const native = isNativeAdminApp();

  const registerPush = useCallback(async () => {
    if (!native || !user?.id) return false;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Listeners MUST be attached before register() or the token event is missed.
      if (!listenersReadyRef.current) {
        listenersReadyRef.current = true;

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
            toast.message('Could not save phone alerts', {
              description: error.message || 'Try Allow notifications again after reopening the app.',
            });
          } else {
            toast.success('Phone alerts enabled for this app');
          }
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.warn('Push registration error', err);
          toast.message('Push setup incomplete', {
            description:
              'Firebase may be missing from this APK build. Rebuild with google-services.json, then reinstall.',
          });
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
          const data = event.notification.data as {
            url?: string;
            path?: string;
            whatsappUrl?: string;
            action?: string;
          } | undefined;
          // OTP: optional direct WhatsApp send from tray tap when action is send-otp
          if (data?.action === 'send-otp' && data.whatsappUrl) {
            window.location.href = data.whatsappUrl;
            return;
          }
          if (data?.whatsappUrl && data?.path?.includes('otp=')) {
            // Prefer opening admin OTP panel; user can tap Send OTP there.
          }
          const target = data?.path || data?.url;
          if (target && typeof target === 'string') {
            window.location.href = target.startsWith('http')
              ? target
              : `${window.location.origin}${target.startsWith('/') ? target : `/${target}`}`;
          }
        });
      }

      try {
        await PushNotifications.createChannel({
          id: FCM_CHANNEL_ID,
          name: 'Phoenix Admin',
          description: 'Inquiries, OTP access, and WhatsApp alerts',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true,
        });
      } catch (channelErr) {
        console.warn('createChannel failed', channelErr);
      }

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
      return true;
    } catch (e) {
      console.warn('Native push unavailable', e);
      return false;
    }
  }, [native, user?.id]);

  const requestStorageHint = useCallback(async () => {
    // Android photo access is prompted by the system file picker on upload.
    // Trigger a no-op picker only when the user explicitly allows — here we just remind.
    toast.message('Photos & files', {
      description:
        'Android will ask for photo/folder access the next time you upload images in the dashboard.',
      duration: 4500,
    });
  }, []);

  const handleAllowPermissions = useCallback(async () => {
    setPermBusy(true);
    try {
      const ok = await registerPush();
      await requestStorageHint();
      setShowPerms(false);
      if (ok) {
        try {
          localStorage.setItem(PERMS_FLAG, '1');
        } catch {
          /* ignore */
        }
      }
    } finally {
      setPermBusy(false);
    }
  }, [registerPush, requestStorageHint]);

  const handleUpdateApp = useCallback(async () => {
    if (!update?.apkUrl) return;
    const absolute = resolveAbsoluteAdminUrl(update.apkUrl);
    try {
      // Opens system browser / download manager so the APK can install over the existing app.
      window.open(absolute, '_blank');
      toast.message('Downloading update', {
        description: 'Open the downloaded APK and tap Install. You do not need to uninstall first.',
        duration: 6000,
      });
    } catch {
      window.location.href = absolute;
    }
  }, [update]);

  // After login inside the app: show permissions sheet once, or re-register silently.
  useEffect(() => {
    if (!native || !isAuthenticated || !pathname.startsWith('/admin')) return;
    if (askedRef.current) return;
    askedRef.current = true;

    let already = false;
    try {
      already = localStorage.getItem(PERMS_FLAG) === '1';
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

  // Re-check notification permission when returning to the app; re-prompt if denied/not granted.
  useEffect(() => {
    if (!native || !isAuthenticated) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void (async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const perm = await PushNotifications.checkPermissions();
          if (perm.receive !== 'granted') {
            try {
              localStorage.removeItem(PERMS_FLAG);
            } catch {
              /* ignore */
            }
            setShowPerms(true);
          }
        } catch {
          /* ignore */
        }
      })();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [native, isAuthenticated]);

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
                    Inquiries, OTP requests, and WhatsApp alerts while the app is closed (with sound).
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Photos &amp; folders</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Android asks when you pick images to upload in the dashboard.
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
                  // Do not permanently skip — ask again next session until granted.
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
              Version {update.versionName} is ready. Install over the current app — no uninstall needed.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5" onClick={() => void handleUpdateApp()}>
                <Download className="h-3.5 w-3.5" />
                Update app
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
