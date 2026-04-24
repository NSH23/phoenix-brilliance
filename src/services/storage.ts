import { supabase } from '@/lib/supabase';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  resolveMediaUrl,
  type BucketName,
} from '@/lib/cloudinary';

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
  return uploadToCloudinary(file, bucket);
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
  return Promise.all(files.map((file) => uploadToCloudinary(file, bucket)));
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The path/filename in the bucket
 */
export async function deleteFile(bucket: BucketName, path: string): Promise<void> {
  if (/^https?:\/\//i.test(path)) {
    await deleteFromCloudinary(path);
    return;
  }
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
  for (const p of paths) {
    await deleteFile(bucket, p);
  }
}

/**
 * Get public URL for a file in storage
 * @param bucket - The storage bucket name
 * @param path - The path/filename in the bucket
 * @returns The public URL
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Rebuild a Supabase Storage *public* object URL so it uses the current project (VITE_SUPABASE_URL).
 * After migrating to a new Supabase project, rows often still contain full URLs from the old project;
 * the browser would otherwise keep requesting the old hostname. Non-Supabase URLs are returned unchanged.
 */
export function rewriteSupabaseStoragePublicUrlToCurrentProject(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  const base = trimmed.split('?')[0];
  const m = base.match(/^https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i);
  if (!m) return trimmed;
  const bucket = m[1];
  let objectPath = m[2];
  try {
    objectPath = decodeURIComponent(objectPath);
  } catch {
    /* keep encoded */
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

/** Storage path or full legacy Supabase URL → public URL for this project. */
export function resolvePublicStorageUrl(pathOrUrl: string | null | undefined, fallbackBucket: BucketName): string {
  const raw = (pathOrUrl ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    return resolveMediaUrl(raw);
  }
  return getPublicUrl(fallbackBucket, raw);
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
  if (/^https?:\/\//i.test(path)) return path;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
  if (!data?.signedUrl) throw new Error('No signed URL returned');
  return data.signedUrl;
}

/**
 * Upload team member photo to team-photos (private bucket). Replaces any existing photo.
 * Returns the storage path (store in team.photo_url); use createSignedUrl for display.
 */
export async function uploadTeamPhoto(
  teamId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  void teamId;
  return uploadToCloudinary(file, 'team-photos', onProgress);
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
  displayName?: string,
  onProgress?: (percent: number) => void
): Promise<{ path: string; name: string; fileType: string | null }> {
  void teamId;
  const path = await uploadToCloudinary(file, 'team-documents', onProgress);

  const fileType = file.type || (file.name && file.name.includes('.') ? file.name.split('.').pop()! : null);
  return { path, name: displayName?.trim() || file.name || 'Document', fileType: fileType || null };
}
