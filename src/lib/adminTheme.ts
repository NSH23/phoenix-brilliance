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
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Restore public-site theme from `theme` key (used when leaving admin shell). */
export function applyPublicTheme(): void {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = saved === 'dark' || (!saved && prefersDark);
  document.documentElement.classList.toggle('dark', useDark);
}
