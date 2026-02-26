import { supabase } from '@/lib/supabase';

export type BucketName =
  | 'event-images'
  | 'album-images'
  | 'partner-logos'
  | 'gallery-images'
  | 'before-after-images'
  | 'testimonial-avatars'
  | 'admin-avatars'
  | 'team-photos'
  | 'team-documents'
  | 'service-images'
  | 'site-logo';

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param file - The file to upload
 * @param path - The path/filename in the bucket (optional, defaults to file name)
 * @returns The public URL of the uploaded file
 */
export interface UploadFileOptions {
  upsert?: boolean;
}

export async function uploadFile(
  bucket: BucketName,
  file: File,
  path?: string,
  options?: UploadFileOptions
): Promise<string> {
  const fileName = path || `${Date.now()}-${file.name}`;
  const filePath = fileName.replace(/[^a-zA-Z0-9._/-]/g, '_');

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: options?.upsert ?? false,
    });

  if (error) {
    const msg = error.message ?? '';
    if (/mime type .* is not supported/i.test(msg)) {
      throw new Error(
        `File type not allowed for this bucket. ${msg} ` +
        'Ask an admin to add this type in Storage → bucket → Settings → Allowed MIME types.'
      );
    }
    throw new Error(`Failed to upload file: ${msg}`);
  }

  // Get public URL (not used for private buckets like team-documents)
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Upload multiple files to Supabase Storage
 * @param bucket - The storage bucket name
 * @param files - Array of files to upload
 * @param pathPrefix - Optional prefix for file paths
 * @returns Array of public URLs
 */
export async function uploadFiles(
  bucket: BucketName,
  files: File[],
  pathPrefix?: string
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const fileName = pathPrefix
      ? `${pathPrefix}/${Date.now()}-${index}-${file.name}`
      : `${Date.now()}-${index}-${file.name}`;
    return uploadFile(bucket, file, fileName);
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The path/filename in the bucket
 */
export async function deleteFile(bucket: BucketName, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param bucket - The storage bucket name
 * @param paths - Array of paths/filenames to delete
 */
export async function deleteFiles(bucket: BucketName, paths: string[]): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Get public URL for a file in storage
 * @param bucket - The storage bucket name
 * @param path - The path/filename in the bucket
 * @returns The public URL
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Extract file path from a Supabase Storage URL
 * @param url - The full storage URL
 * @returns The file path
 */
export function extractPathFromUrl(url: string): string {
  // Supabase storage URLs format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  return match ? match[1] : url;
}

/**
 * Get the bucket name from a Supabase Storage URL
 * @param url - The full storage URL
 * @returns The bucket name or null
 */
export function extractBucketFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * List file paths in a folder inside a bucket
 */
export async function listFiles(bucket: BucketName, folderPrefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folderPrefix);
  if (error) throw new Error(`Failed to list files: ${error.message}`);
  const items = (data ?? []).filter((o) => o.name && !String(o.name).startsWith('.'));
  return items.map((o) => (folderPrefix ? `${folderPrefix}/${o.name}` : o.name));
}

/**
 * Create a signed URL for private bucket objects (e.g. team-documents)
 */
export async function createSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn = 60
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
  if (!data?.signedUrl) throw new Error('No signed URL returned');
  return data.signedUrl;
}

/**
 * Upload team member photo to team-photos (private bucket). Replaces any existing photo.
 * Returns the storage path (store in team.photo_url); use createSignedUrl for display.
 */
export async function uploadTeamPhoto(teamId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeExt = ext || 'jpg';
  const path = `${teamId}/avatar.${safeExt}`;

  const existing = await listFiles('team-photos', teamId);
  if (existing.length > 0) {
    await deleteFiles('team-photos', existing);
  }

  const { error } = await supabase.storage
    .from('team-photos')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) throw new Error(`Failed to upload photo: ${error.message}`);
  return path;
}

/**
 * Delete team member photo from team-photos
 */
export async function deleteTeamPhoto(teamId: string): Promise<void> {
  const existing = await listFiles('team-photos', teamId);
  if (existing.length > 0) await deleteFiles('team-photos', existing);
}

/**
 * Upload a document to team-documents (private bucket). Returns path and suggested name for DB.
 */
export async function uploadTeamDocument(
  teamId: string,
  file: File,
  displayName?: string
): Promise<{ path: string; name: string; fileType: string | null }> {
  const uid = crypto.randomUUID();
  const base = (file.name || 'document').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
  const path = `${teamId}/${uid}-${base}`;

  const { error } = await supabase.storage
    .from('team-documents')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Failed to upload document: ${error.message}`);

  const fileType = file.type || (file.name && file.name.includes('.') ? file.name.split('.').pop()! : null);
  return { path, name: displayName?.trim() || file.name || 'Document', fileType: fileType || null };
}
