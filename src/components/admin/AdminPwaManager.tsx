import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  applyAdminManifest,
  applyPublicManifest,
  canShowManualInstallHint,
  dismissInstallPrompt,
  isAdminPath,
  isInstallDismissed,
  isStandaloneDisplay,
  isIosSafari,
  isMacSafari,
  registerAdminServiceWorker,
  setThemeColor,
  type BeforeInstallPromptEvent,
} from '@/lib/adminPwa';

export default function AdminPwaManager() {
  const { pathname } = useLocation();
  const onAdmin = isAdminPath(pathname);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [manualHint, setManualHint] = useState(false);

  useEffect(() => {
    if (!onAdmin) {
      applyPublicManifest();
      setThemeColor('#0B1220');
      setDeferredPrompt(null);
      setVisible(false);
      setManualHint(false);
      return;
    }

    applyAdminManifest();
    setThemeColor('#0B1220');
    void registerAdminServiceWorker();

    if (isStandaloneDisplay() || isInstallDismissed()) return;

    const showManual = canShowManualInstallHint();
    setManualHint(showManual);
    if (showManual) setVisible(true);
  }, [onAdmin]);

  useEffect(() => {
    if (!onAdmin) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (isStandaloneDisplay() || isInstallDismissed()) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
      setManualHint(false);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
      setManualHint(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [onAdmin]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.warn('Admin PWA install failed', error);
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
    setDeferredPrompt(null);
  }, []);

  if (!onAdmin || !visible || isStandaloneDisplay()) return null;

  const isDesktopManual = manualHint && !deferredPrompt;
  const isMacManual = isDesktopManual && isMacSafari();
  const isIosManual = isDesktopManual && isIosSafari();

  return (
    <div
      className={cn(
        'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-md',
        'animate-in slide-in-from-bottom-4 duration-300'
      )}
      role="region"
      aria-label="Install admin app"
    >
      <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {isDesktopManual ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install Phoenix Admin</p>
          {deferredPrompt ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add the admin dashboard to your desktop or home screen for quick access.
            </p>
          ) : isMacManual ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              In Safari, open the Share menu and choose &quot;Add to Dock&quot; to install Phoenix Admin on your Mac.
            </p>
          ) : isIosManual ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tap <Share className="inline h-3 w-3 align-text-bottom" /> Share, then &quot;Add to Home Screen&quot; to install the admin app.
            </p>
          ) : isDesktopManual ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use your browser menu to install this page as an app for quick admin access.
            </p>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              Install for a full-screen admin experience.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {deferredPrompt ? (
              <Button size="sm" className="h-8 gap-1.5" disabled={installing} onClick={() => void handleInstall()}>
                <Download className="h-3.5 w-3.5" />
                {installing ? 'Installing…' : 'Install app'}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" className="h-8" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
