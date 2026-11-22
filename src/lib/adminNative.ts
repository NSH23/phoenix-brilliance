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
  // Always use the live production host for APK downloads (WebView origin can be capacitor://).
  return `https://phoenixeventsandproduction.com${
    pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  }`;
}

type ApkInstallerPlugin = {
  installFromUrl: (opts: { url: string }) => Promise<{
    ok?: boolean;
    downloading?: boolean;
    openedExternal?: boolean;
    needsInstallPermission?: boolean;
  }>;
  openExternal: (opts: { url: string }) => Promise<{ ok?: boolean }>;
  addListener?: (
    event: string,
    cb: (data: { ok?: boolean; error?: string }) => void,
  ) => Promise<{ remove: () => void }> | { remove: () => void };
};

async function getApkInstaller(): Promise<ApkInstallerPlugin | null> {
  try {
    const { registerPlugin, Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;
    return registerPlugin<ApkInstallerPlugin>('ApkInstaller');
  } catch {
    return null;
  }
}

function triggerAnchorDownload(absolute: string) {
  const a = document.createElement('a');
  a.href = absolute;
  a.download = 'phoenix-admin.apk';
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Start APK update download. Prefers native DownloadManager (status-bar progress),
 * then external browser, then WebView navigation / anchor click.
 */
export async function installApkUpdate(apkUrl: string): Promise<{
  ok: boolean;
  downloading?: boolean;
  needsInstallPermission?: boolean;
  openedExternal?: boolean;
  error?: string;
}> {
  const absolute = resolveAbsoluteAdminUrl(apkUrl);
  const installer = await getApkInstaller();

  if (installer?.installFromUrl) {
    try {
      const result = await installer.installFromUrl({ url: absolute });
      if (result?.needsInstallPermission) {
        return { ok: false, needsInstallPermission: true };
      }
      if (result?.openedExternal) {
        return { ok: true, openedExternal: true };
      }
      return { ok: true, downloading: Boolean(result?.downloading ?? true) };
    } catch (e) {
      // Try openExternal on the same plugin (still native Intent).
      try {
        if (installer.openExternal) {
          await installer.openExternal({ url: absolute });
          return { ok: true, openedExternal: true };
        }
      } catch {
        /* fall through */
      }
      const message = e instanceof Error ? e.message : String(e);
      triggerAnchorDownload(absolute);
      try {
        window.location.assign(absolute);
      } catch {
        /* ignore */
      }
      return { ok: true, openedExternal: true, error: message };
    }
  }

  triggerAnchorDownload(absolute);
  try {
    window.location.assign(absolute);
  } catch {
    /* ignore */
  }
  return { ok: true, openedExternal: true };
}
