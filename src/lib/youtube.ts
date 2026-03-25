// Helper functions for YouTube

// Extract YouTube ID from full URL or return as-is if already an ID
export function getYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const value = urlOrId.trim();

  // Already a plain ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  // Try URL parsing for common formats:
  // - youtube.com/watch?v=VIDEO_ID
  // - youtube.com/shorts/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - m.youtube.com/*
  const needsScheme =
    !/^https?:\/\//i.test(value) &&
    (value.startsWith('www.') ||
      value.startsWith('youtube.com') ||
      value.startsWith('youtu.be') ||
      value.startsWith('m.youtube.com'));

  const toParse = needsScheme ? `https://${value}` : value;

  try {
    const u = new URL(toParse);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname || '';

    // youtu.be/<id>
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const id = pathname.split('/').filter(Boolean)[0] ?? '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
    }

    // youtube.com / m.youtube.com / youtube-nocookie.com
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const parts = pathname.split('/').filter(Boolean);

      // /watch?v=<id>
      if (parts[0] === 'watch') {
        const id = u.searchParams.get('v') ?? '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
      }

      // /shorts/<id>, /embed/<id>, /v/<id>
      if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'v') {
        const id = parts[1] ?? '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
      }

      // Fallback: find a matching 11-char token in the pathname
      const joined = parts.join('/');
      const match = joined.match(/[a-zA-Z0-9_-]{11}/);
      return match ? match[0] : '';
    }
  } catch {
    // ignore and fall back to regex below
  }

  // Regex fallback for non-URL inputs
  const match = value.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : '';
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(urlOrId: string): string {
  const id = getYouTubeId(urlOrId);
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// Get YouTube embed URL
export function getYouTubeEmbedUrl(urlOrId: string): string {
  const id = getYouTubeId(urlOrId);
  if (!id) return '';
  // Shorts should still embed via /embed/VIDEO_ID (not /shorts/VIDEO_ID).
  // We rely on correct ID extraction above.
  // Note: browsers may still block autoplay with sound depending on user interaction/policies.
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
}

export function isYouTubeValue(urlOrId: string): boolean {
  return !!getYouTubeId(urlOrId);
}

