import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyAdminTheme, getStoredAdminTheme } from '@/lib/adminTheme';
import { applyPublicTheme, getStoredPublicTheme } from '@/lib/publicTheme';

/** Keeps admin routes on `admin-theme` (default light) without flashing public theme between admin pages. */
export default function AdminThemeSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isAdminShell = pathname.startsWith('/admin');
    if (isAdminShell) {
      applyAdminTheme(getStoredAdminTheme());
    } else {
      applyPublicTheme(getStoredPublicTheme());
    }
  }, [pathname]);

  return null;
}
