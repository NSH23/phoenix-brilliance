const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const BUCKET_TO_FOLDER = {
  'event-images': 'phoenix/event-images',
  'album-images': 'phoenix/album-images',
  'partner-logos': 'phoenix/partner-logos',
  'gallery-images': 'phoenix/gallery-images',
  'before-after-images': 'phoenix/before-after-images',
  'testimonial-avatars': 'phoenix/testimonial-avatars',
  'admin-avatars': 'phoenix/admin-avatars',
  'team-photos': 'phoenix/team-photos',
  'team-documents': 'phoenix/team-documents',
  'service-images': 'phoenix/service-images',
  'site-logo': 'phoenix/site-logo',
  'content-media': 'phoenix/content-media',
  'wp-agent-media': 'phoenix/wp-agent-media',
  'background-images': 'phoenix/backgrounds',
} as const;

export type BucketName = keyof typeof BUCKET_TO_FOLDER;

export async function uploadToCloudinary(
  file: File,
  bucket: BucketName,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary env variables are not set. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  const folder = BUCKET_TO_FOLDER[bucket] ?? `phoenix/${bucket}`;
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const isPdf =
    file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  // PDFs as image/upload so WhatsApp receives a native document (raw/upload often shows as link only).
  const resourceType = isVideo ? 'video' : isImage || isPdf ? 'image' : 'raw';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url as string);
      } else {
        let msg = 'Cloudinary upload failed';
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err?.error?.message ?? msg;
        } catch {
          /* ignore */
        }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
    xhr.send(formData);
  });
}

export async function deleteFromCloudinary(url: string): Promise<void> {
  console.warn(
    '[Cloudinary] Client-side deletion is not supported with unsigned presets. File URL:',
    url
  );
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

/** Delivery URL WhatsApp can fetch as a native document (not a text link). */
export function toWhatsAppDocumentUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const base = url.split('?')[0];
  const qs = url.includes('?') ? url.slice(url.indexOf('?')) : '';
  if (base.includes('/raw/upload/')) {
    const imagePath = base.replace('/raw/upload/', '/image/upload/');
    return /\.pdf$/i.test(imagePath) ? `${imagePath}${qs}` : `${imagePath}.pdf${qs}`;
  }
  if (!/\.pdf$/i.test(base)) return `${base}.pdf${qs}`;
  return url;
}

export function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.co/storage');
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}

