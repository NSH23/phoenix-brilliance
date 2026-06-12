/** Active-state matching for the public mobile bottom tab bar. */
export function isPublicBottomNavTabActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";

  if (href === "/") {
    return path === "/";
  }

  if (href === "/events") {
    return (
      path === "/events" ||
      path.startsWith("/events/") ||
      path.startsWith("/gallery/")
    );
  }

  if (href === "/venues") {
    return (
      path === "/venues" ||
      path.startsWith("/venues/") ||
      path === "/collaborations" ||
      path.startsWith("/collaborations/")
    );
  }

  if (href === "/contact") {
    return path === "/contact";
  }

  const base = href.replace(/\/$/, "");
  return path === base || path.startsWith(`${base}/`);
}
