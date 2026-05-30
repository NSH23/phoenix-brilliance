import { uploadToCloudinary } from '@/lib/cloudinary';

const CONTENT_MEDIA_BUCKET = 'content-media';

/** Upload a video/image file to the content-media bucket. Returns public URL. */
export async function uploadContentMediaFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return uploadToCloudinary(file, CONTENT_MEDIA_BUCKET as typeof CONTENT_MEDIA_BUCKET, onProgress);
}
