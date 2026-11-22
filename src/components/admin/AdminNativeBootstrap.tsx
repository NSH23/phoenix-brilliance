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
const FCM_OK_FLAG = 'phoenix_admin_fcm_ok_v1';
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
  const [fcmReady, setFcmReady] = useState(() => {
    try {
      return localStorage.getItem(FCM_OK_FLAG) === '1';
    } catch {
      return false;
    }
  });
  const askedRef = useRef(false);
  const listenersReadyRef = useRef(false);
  const userIdRef = useRef<string | undefined>(user?.id);
  const native = isNativeAdminApp();

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const saveFcmToken = useCallback(async (fcmToken: string) => {
    let userId = userIdRef.current;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }
    if (!userId || !fcmToken) {
      toast.message('Could not enable phone alerts', {
        description: 'You need to be logged in. Open the app, sign in, then try again.',
      });
      return false;
    }

    const { error } = await supabase.from('admin_fcm_devices').upsert(
      {
        user_id: userId,
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
        duration: 6000,
      });
      return false;
    }

    try {
      localStorage.setItem(FCM_OK_FLAG, '1');
      localStorage.setItem(PERMS_FLAG, '1');
    } catch {
      /* ignore */
    }
    setFcmReady(true);
    toast.success('Phone alerts enabled for this app', {
      description: 'You will get sounds on the lock screen when the app is closed.',
      duration: 6000,
    });
    return true;
  }, []);

  const registerPush = useCallback(async () => {
    if (!native) {
      toast.message('Open the Phoenix Admin app', {
        description: 'Closed-app alerts only work inside the installed Android app, not in Chrome.',
      });
      return false;
    }
    if (!user?.id) return false;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Listeners MUST be attached before register() or the token event is missed.
      if (!listenersReadyRef.current) {
        listenersReadyRef.current = true;

        await PushNotifications.addListener('registration', (token) => {
          const fcmToken = token.value;
          if (!fcmToken) return;
          void saveFcmToken(fcmToken);
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.warn('Push registration error', err);
          try {
            localStorage.removeItem(FCM_OK_FLAG);
          } catch {
            /* ignore */
          }
          setFcmReady(false);
          toast.message('Push setup incomplete', {
            description:
              'Firebase may be missing from this APK. Rebuild with google-services.json, then reinstall.',
            duration: 7000,
          });
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
          const data = event.notification.data as {
            url?: string;
            path?: string;
            whatsappUrl?: string;
            action?: string;
          } | undefined;
          if (data?.action === 'send-otp' && data.whatsappUrl) {
            window.location.href = data.whatsappUrl;
            return;
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
          description:
            'Android Settings → Apps → Phoenix Admin → Notifications → Allow, then tap Enable phone alerts again.',
          duration: 8000,
        });
        return false;
      }

      await PushNotifications.register();
      toast.message('Setting up phone alerts…', {
        description: 'Allow the system prompt if shown. Wait for “Phone alerts enabled”.',
        duration: 4500,
      });
      return true;
    } catch (e) {
      console.warn('Native push unavailable', e);
      toast.message('Phone alerts unavailable', {
        description:
          'This build may not include push plugins. Open the installed Phoenix Admin APK (not the browser).',
        duration: 7000,
      });
      return false;
    }
  }, [native, user?.id, saveFcmToken]);

  const requestStorageHint = useCallback(async () => {
    toast.message('Photos & files', {
      description:
        'Android will ask for photo/folder access the next time you upload images in the dashboard.',
      duration: 4500,
    });
  }, []);

  const handleAllowPermissions = useCallback(async () => {
    setPermBusy(true);
    try {
      await registerPush();
      await requestStorageHint();
      setShowPerms(false);
    } finally {
      setPermBusy(false);
    }
  }, [registerPush, requestStorageHint]);

  const handleUpdateApp = useCallback(async () => {
    if (!update?.apkUrl) return;
    const absolute = resolveAbsoluteAdminUrl(update.apkUrl);
    try {
      window.open(absolute, '_blank');
      toast.message('Downloading update', {
        description: 'Open the downloaded APK and tap Install. You do not need to uninstall first.',
        duration: 6000,
      });
    } catch {
      window.location.href = absolute;
    }
  }, [update]);

  // After login inside the app: show permissions sheet if FCM not confirmed yet.
  useEffect(() => {
    if (!native || !isAuthenticated || !pathname.startsWith('/admin')) return;
    if (askedRef.current) return;
    askedRef.current = true;

    let fcmOk = false;
    try {
      fcmOk = localStorage.getItem(FCM_OK_FLAG) === '1';
    } catch {
      fcmOk = false;
    }

    const timer = window.setTimeout(() => {
      if (fcmOk) {
        setFcmReady(true);
        void registerPush();
      } else {
        setShowPerms(true);
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [native, isAuthenticated, pathname, registerPush]);

  // Re-check notification permission when returning to the app.
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
              localStorage.removeItem(FCM_OK_FLAG);
              localStorage.removeItem(PERMS_FLAG);
            } catch {
              /* ignore */
            }
            setFcmReady(false);
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
            <p className="text-base font-semibold">Allow phone notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Without this, you only see alerts inside the open app. Closed-app lock-screen alerts need
              Android permission.
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">Notifications</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    After you tap Allow, wait for the green toast: “Phone alerts enabled for this app”.
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
                  <span className="font-medium">Stay logged in</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Same login as the web dashboard. Live site updates load automatically.
                  </span>
                </span>
              </li>
            </ul>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" disabled={permBusy} onClick={() => void handleAllowPermissions()}>
                {permBusy ? 'Requesting…' : 'Allow & enable phone alerts'}
              </Button>
              <Button
                variant="ghost"
                disabled={permBusy}
                onClick={() => {
                  setShowPerms(false);
                }}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAuthenticated && !fcmReady && !showPerms ? (
        <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-[65] px-3 md:left-auto md:right-4 md:max-w-sm">
          <div className="rounded-xl border border-amber-500/40 bg-card p-3 shadow-lg">
            <p className="text-sm font-semibold">Phone alerts not enabled yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              In-app bell works, but closed-app notifications need one tap below. Look for the green
              “Phone alerts enabled” message after.
            </p>
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={permBusy}
              onClick={() => {
                setShowPerms(true);
              }}
            >
              Enable phone alerts
            </Button>
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
