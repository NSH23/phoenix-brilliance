const PUBLIC_MANIFEST = '/site.webmanifest';
const ADMIN_MANIFEST = '/admin.webmanifest';
const ADMIN_SW_URL = '/admin/sw.js';
const DISMISS_KEY = 'admin-pwa-install-dismissed-at';
const DISMISS_DAYS = 14;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function getManifestLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  return link;
}

export function applyPublicManifest(): void {
  getManifestLink().href = PUBLIC_MANIFEST;
}

export function applyAdminManifest(): void {
  getManifestLink().href = ADMIN_MANIFEST;
}

export function setThemeColor(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export async function registerAdminServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/admin/');
    if (existing?.active?.scriptURL.includes('/admin/sw.js')) return existing;
    return await navigator.serviceWorker.register(ADMIN_SW_URL, { scope: '/admin/' });
  } catch (error) {
    console.warn('Admin PWA service worker registration failed', error);
    return null;
  }
}

export function isInstallDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (Number.isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Edg|OPR/.test(ua);
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS && isSafariBrowser();
}

export function isMacSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isMac = /Macintosh|Mac OS X/.test(ua) && navigator.maxTouchPoints <= 1;
  return isMac && isSafariBrowser();
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function canShowManualInstallHint(): boolean {
  if (isStandaloneDisplay()) return false;
  return isIosSafari() || isMacSafari();
}
