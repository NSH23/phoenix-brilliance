import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { Loader2, Globe, Smartphone, Download, ArrowLeft, ShieldCheck } from 'lucide-react';
import AdminLogin from './Login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { isNativeAdminApp } from '@/lib/adminNative';

type Mode = 'choose' | 'web' | 'install-auth' | 'install-ready';

const APP_VERSION_URL = '/admin-app/version.json';

type AppVersionInfo = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releasedAt?: string;
};

export default function AdminEntry() {
  const { isAuthenticated, isLoading, login, logout } = useAdmin();
  const { logoUrl } = useSiteConfig();
  const navigate = useNavigate();
  const logoSrc = logoUrl || '/logo.png';
  const nativeApp = isNativeAdminApp();

  // Android shell loads /admin — skip chooser and go straight to login.
  const [mode, setMode] = useState<Mode>(() => (isNativeAdminApp() ? 'web' : 'choose'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    if (nativeApp && mode === 'choose') setMode('web');
  }, [nativeApp, mode]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && mode === 'choose') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, mode, navigate]);

  useEffect(() => {
    void fetch(APP_VERSION_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.apkUrl && data?.versionCode) setVersion(data as AppVersionInfo);
      })
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="admin-dashboard flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (mode === 'web') {
    return (
      <div className="relative">
        {!nativeApp ? (
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        ) : null}
        <AdminLogin />
      </div>
    );
  }

  if (mode === 'install-auth' || mode === 'install-ready') {
    return (
      <div className="admin-dashboard flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-lg sm:p-8">
          <button
            type="button"
            onClick={() => {
              setMode('choose');
              setPassword('');
            }}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="mb-6 flex items-center gap-3">
            <img src={logoSrc} alt="Phoenix" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg font-semibold">Install Android app</h1>
              <p className="text-xs text-muted-foreground">Admin login required before download</p>
            </div>
          </div>

          {mode === 'install-ready' && version ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Verified — download unlocked</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Version {version.versionName} (build {version.versionCode})
                </p>
              </div>
              <Button asChild className="h-11 w-full gap-2">
                <a href={version.apkUrl} download={`phoenix-admin-${version.versionName}.apk`}>
                  <Download className="h-4 w-4" />
                  Download APK
                </a>
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                After install, open <strong>Phoenix Admin</strong>, log in again, then allow
                notifications when asked. The app loads the live dashboard, so website updates appear
                automatically; a new APK build is only needed for native/app-shell updates.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  void logout();
                  setMode('web');
                }}
              >
                Continue on web instead
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  if (!email.trim() || !password) {
                    toast.error('Enter admin email and password');
                    return;
                  }
                  setBusy(true);
                  try {
                    const result = await login(email.trim(), password);
                    if (!result.success) {
                      toast.error(result.message || 'Login failed');
                      return;
                    }
                    // Confirm still an admin row (login already checks).
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (!sessionData.session) {
                      toast.error('Session missing. Try again.');
                      return;
                    }
                    if (!version?.apkUrl) {
                      toast.error('APK is not published yet. Ask the developer to upload a build.');
                      return;
                    }
                    setMode('install-ready');
                    toast.success('Verified — you can download the app');
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="install-email">Admin email</Label>
                <Input
                  id="install-email"
                  type="email"
                  name="phoenix-install-email"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-1p-ignore
                  data-lpignore="true"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-password">Password</Label>
                <Input
                  id="install-password"
                  type="password"
                  name="phoenix-install-password"
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify & unlock download
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Chooser
  return (
    <div className="admin-dashboard flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoSrc} alt="Phoenix" className="mb-4 h-14 w-14 object-contain" />
          <h1 className="text-2xl font-semibold tracking-tight">Phoenix Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose how you want to open the admin dashboard
          </p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setMode('web')}
            className="flex items-start gap-4 rounded-xl border border-border/70 bg-background/60 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Use on web</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                Open the admin dashboard in the browser. After login, you can install the PWA
                (Add to Home Screen / Install app) for quick access and web push alerts.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('install-auth')}
            className="flex items-start gap-4 rounded-xl border border-border/70 bg-background/60 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Install Android application</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                Requires admin email &amp; password, then downloads the private APK. After install,
                log in again inside the app.
              </span>
            </span>
          </button>
        </div>

        {version ? (
          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Latest Android build: v{version.versionName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
