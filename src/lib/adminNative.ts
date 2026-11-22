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

/** Stable download path that always points at the newest published APK. */
export const LATEST_APK_PATH = '/admin-app/latest/phoenix-admin.apk';
export const APP_VERSION_URL = '/admin-app/version.json';

export async function fetchRemoteAppVersion(): Promise<RemoteAppVersion | null> {
  try {
    const bust = `t=${Date.now()}`;
    const res = await fetch(`${APP_VERSION_URL}?${bust}`, { cache: 'no-store' });
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

/**
 * Download + open the system installer for a new APK (overwrites current install).
 * Falls back to opening the APK URL if the native plugin is not present yet.
 */
export async function installApkUpdate(apkUrl: string): Promise<{
  ok: boolean;
  needsInstallPermission?: boolean;
  fallbackOpened?: boolean;
  error?: string;
}> {
  const absolute = resolveAbsoluteAdminUrl(apkUrl);
  try {
    type Installer = {
      installFromUrl: (opts: { url: string }) => Promise<{
        ok?: boolean;
        needsInstallPermission?: boolean;
      }>;
    };
    const { registerPlugin } = await import('@capacitor/core');
    const installer = registerPlugin<Installer>('ApkInstaller');
    if (installer?.installFromUrl) {
      const result = await installer.installFromUrl({ url: absolute });
      if (result?.needsInstallPermission) {
        return { ok: false, needsInstallPermission: true };
      }
      return { ok: true };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Fall through to browser download for older APK shells.
    try {
      window.open(absolute, '_blank');
      return { ok: true, fallbackOpened: true, error: message };
    } catch {
      window.location.href = absolute;
      return { ok: true, fallbackOpened: true, error: message };
    }
  }

  try {
    window.open(absolute, '_blank');
    return { ok: true, fallbackOpened: true };
  } catch {
    window.location.href = absolute;
    return { ok: true, fallbackOpened: true };
  }
}
