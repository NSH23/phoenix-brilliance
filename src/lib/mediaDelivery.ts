import { isCloudinaryUrl } from '@/lib/cloudinary';

export type ImageDeliveryPreset =
  | 'thumb'
  | 'card'
  | 'hero'
  | 'banner'
  | 'lightbox'
  | 'full';

/** Default `src` width per preset — tuned for sharp 2× retina without shipping originals. */
const PRESET_WIDTHS: Record<ImageDeliveryPreset, number | undefined> = {
  thumb: 480,
  card: 1280,
  hero: 1920,
  banner: 1280,
  lightbox: 1920,
  full: 1920,
};

/** `srcSet` steps — browser picks the best match for viewport + DPR. */
export const PRESET_SRCSET_WIDTHS: Record<ImageDeliveryPreset, number[]> = {
  thumb: [240, 360, 480],
  card: [640, 960, 1280, 1536],
  hero: [1080, 1440, 1920],
  banner: [960, 1280, 1600],
  lightbox: [1280, 1920, 2560],
  full: [1280, 1920, 2560],
};

const TRANSFORM_SEGMENT = /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?/;

function buildTransform(width: number, useDpr: boolean): string {
  const parts = ['f_auto', 'q_auto:good', `w_${width}`, 'c_limit'];
  if (useDpr) parts.push('dpr_auto');
  return parts.join(',');
}

/**
 * Apply Cloudinary delivery transforms (WebP/AVIF auto, good quality, width cap).
 * Non-Cloudinary URLs pass through unchanged.
 */
export function optimizeMediaUrl(
  url: string | null | undefined,
  options?: { width?: number; preset?: ImageDeliveryPreset; dpr?: boolean },
): string {
  const raw = (url ?? '').trim();
  if (!raw || !isCloudinaryUrl(raw)) return raw;

  const width =
    options?.width ??
    (options?.preset ? PRESET_WIDTHS[options.preset] : PRESET_WIDTHS.card);
  if (!width) return raw;

  if (/\/upload\/[^/]*w_\d+/.test(raw)) return raw;

  const useDpr = options?.dpr ?? true;
  const transform = buildTransform(width, useDpr);

  if (TRANSFORM_SEGMENT.test(raw)) {
    return raw.replace(TRANSFORM_SEGMENT, `/upload/${transform}/`);
  }
  return raw.replace('/upload/', `/upload/${transform}/`);
}

/** Responsive srcset for Cloudinary images. */
export function buildMediaSrcSet(
  url: string | null | undefined,
  preset: ImageDeliveryPreset = 'card',
): string | undefined {
  const raw = (url ?? '').trim();
  if (!raw || !isCloudinaryUrl(raw)) return undefined;
  const widths = PRESET_SRCSET_WIDTHS[preset];
  return widths
    .map((w) => `${optimizeMediaUrl(raw, { width: w, dpr: false })} ${w}w`)
    .join(', ');
}

export const SRCSET_SIZES = {
  thumb: '96px',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  hero: '100vw',
  banner: '(max-width: 1024px) 100vw, 50vw',
  gallery: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  lightbox: '100vw',
} as const;

export function sizesForPreset(preset: ImageDeliveryPreset): string | undefined {
  if (preset === 'thumb') return SRCSET_SIZES.thumb;
  if (preset === 'hero') return SRCSET_SIZES.hero;
  if (preset === 'banner') return SRCSET_SIZES.banner;
  if (preset === 'lightbox' || preset === 'full') return SRCSET_SIZES.lightbox;
  return SRCSET_SIZES.card;
}
