/**
 * Prefer WebP variants generated in /public/webp/ for decorative CSS backgrounds.
 * Falls back to the original JPEG for older browsers.
 */
export function staticBackgroundImageSet(jpgPath: string): string {
  const normalized = jpgPath.startsWith('/') ? jpgPath : `/${jpgPath}`;
  const webp = `/webp${normalized.replace(/\.jpe?g$/i, '.webp')}`;
  return `image-set(url('${webp}') type('image/webp'), url('${normalized}') type('image/jpeg'))`;
}
