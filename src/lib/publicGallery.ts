/**
 * Toggle the standalone public Gallery hub (/gallery listing pages).
 *
 * Set VITE_PUBLIC_GALLERY_ENABLED=true in .env to restore Gallery in the navbar
 * and re-enable /gallery + /gallery/:eventType routes.
 *
 * Album detail URLs (/gallery/:eventType/:albumId) stay registered either way so
 * existing links and Event pages keep working.
 */

function parseEnvFlag(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  const normalized = String(value).toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function isPublicGalleryHubEnabled(): boolean {
  return parseEnvFlag(import.meta.env.VITE_PUBLIC_GALLERY_ENABLED, false);
}

export type PublicNavLink = { name: string; href: string };

/** Primary nav links for Navbar (Gallery omitted when hub is disabled). */
export function getPublicNavLinks(): PublicNavLink[] {
  const links: PublicNavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'Events', href: '/events' },
    { name: 'Venues', href: '/venues' },
  ];
  if (isPublicGalleryHubEnabled()) {
    links.push({ name: 'Gallery', href: '/gallery' });
  }
  links.push({ name: 'Contact', href: '/contact' });
  return links;
}

/** Footer quick links (Gallery omitted when hub is disabled). */
export function getPublicFooterQuickLinks(): PublicNavLink[] {
  const links: PublicNavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'Events', href: '/events' },
    { name: 'Services', href: '/#services' },
  ];
  if (isPublicGalleryHubEnabled()) {
    links.push({ name: 'Gallery', href: '/gallery' });
  }
  links.push({ name: 'Testimonials', href: '/#testimonials' });
  links.push({ name: 'Contact', href: '/contact' });
  return links;
}

/** CTA target for “view all photos” style links on the homepage. */
export function publicGalleryHubPath(): string {
  return isPublicGalleryHubEnabled() ? '/gallery' : '/events';
}

/** Per-event gallery listing — Events detail when hub is off. */
export function publicEventGalleryListingPath(eventSlug: string): string {
  return isPublicGalleryHubEnabled() ? `/gallery/${eventSlug}` : `/events/${eventSlug}`;
}

/** Album detail (always under /gallery for stable URLs). */
export function publicAlbumPath(eventSlug: string, albumId: string): string {
  return `/gallery/${eventSlug}/${albumId}`;
}
