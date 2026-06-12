/**
 * Public gallery / venue drill-down pages are immersive — no site footer.
 * Listing pages (/events, /venues, /gallery) keep the footer.
 */
export function shouldHidePublicFooter(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";

  // Event category → album folders (e.g. /events/Wedding)
  if (/^\/events\/[^/]+$/.test(path)) return true;

  // Gallery hub event category (e.g. /gallery/Wedding) — not the hub root
  if (/^\/gallery\/[^/]+$/.test(path) && path !== "/gallery/all") return true;

  // Event album → photos (e.g. /gallery/Wedding/:albumId)
  if (/^\/gallery\/[^/]+\/[^/]+$/.test(path)) return true;

  // Venue detail → folders / albums / photos (e.g. /venues/:partnerId)
  if (/^\/venues\/[^/]+$/.test(path)) return true;

  return false;
}
