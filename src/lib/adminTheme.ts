const ADMIN_THEME_KEY = 'admin-theme';

export type AdminTheme = 'light' | 'dark';

export function getStoredAdminTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(ADMIN_THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function setStoredAdminTheme(theme: AdminTheme): void {
  localStorage.setItem(ADMIN_THEME_KEY, theme);
}

export function applyAdminTheme(theme: AdminTheme): void {
  const root = document.documentElement;
  root.classList.remove('blush');
  root.classList.toggle('dark', theme === 'dark');
}

/** Restore public-site theme from `theme` key (used when leaving admin shell). */
export { applyPublicTheme, getStoredPublicTheme } from "@/lib/publicTheme";
