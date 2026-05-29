import type { AdminMenuItem } from '@/lib/adminMenu';

/** Hrefs pinned on the mobile bottom bar — excluded from the overflow menu sheet. */
export const WEBSITE_MOBILE_TAB_HREFS = [
  '/admin/dashboard',
  '/admin/events',
  '/admin/gallery',
  '/admin/notifications',
] as const;

export const WP_MOBILE_TAB_HREFS = [
  '/admin/wp-dashboard',
  '/admin/wp-leads',
  '/admin/wp-alerts',
  '/admin/wp-analytics',
] as const;

function hrefBase(href: string): string {
  return href.split('?')[0] ?? href;
}

function isExcludedFromOverflowMenu(itemHref: string, tabHrefs: readonly string[]): boolean {
  const base = hrefBase(itemHref);
  return tabHrefs.some((tab) => {
    const tabBase = hrefBase(tab);
    return base === tabBase;
  });
}

export function filterMenuItemsForMobileOverflow(
  items: AdminMenuItem[],
  workspace: 'website' | 'wp'
): AdminMenuItem[] {
  const tabHrefs = workspace === 'wp' ? WP_MOBILE_TAB_HREFS : WEBSITE_MOBILE_TAB_HREFS;
  return items.filter((item) => !isExcludedFromOverflowMenu(item.href, tabHrefs));
}
