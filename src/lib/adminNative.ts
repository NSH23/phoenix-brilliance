/** Capacitor / native Android helpers used by the admin web app. */

export function isNativeAdminApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        getPlatform?: () => string;
      };
    }
  ).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return true;
  if (typeof cap.getPlatform === 'function') {
    const platform = cap.getPlatform();
    return platform === 'android' || platform === 'ios';
  }
  return false;
}

export type RemoteAppVersion = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releasedAt?: string;
  notes?: string;
};

export async function fetchRemoteAppVersion(): Promise<RemoteAppVersion | null> {
  try {
    const res = await fetch('/admin-app/version.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as RemoteAppVersion;
    if (!data?.versionCode || !data?.apkUrl) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getNativeAppBuild(): Promise<{ versionCode: number; versionName: string } | null> {
  if (!isNativeAdminApp()) return null;
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return {
      versionCode: Number(info.build) || 0,
      versionName: info.version || '0',
    };
  } catch {
    return null;
  }
}

/** Turn a site-relative admin-app path into an absolute URL for APK download/install. */
export function resolveAbsoluteAdminUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://phoenixeventsandproduction.com';
  return `${origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
