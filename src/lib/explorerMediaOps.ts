import type { ExplorerMediaItem } from '@/lib/mediaFolderTree';
import { GALLERY_ROOT_ID, UNCategorized_FOLDER_ID } from '@/lib/mediaFolderTree';

export type MediaClipboard = {
  mode: 'copy' | 'cut';
  items: ExplorerMediaItem[];
} | null;

export function mediaKey(item: ExplorerMediaItem): string {
  return item.id ?? `${item.media_type}:${item.url}:${item.folder_id ?? 'null'}`;
}

export function resolveDropFolderId(folderId: string | null): string | null {
  if (!folderId || folderId === GALLERY_ROOT_ID || folderId === UNCategorized_FOLDER_ID) return null;
  return folderId;
}

export function moveMediaItems(
  media: ExplorerMediaItem[],
  itemKeys: Set<string>,
  targetFolderId: string | null
): ExplorerMediaItem[] {
  const target = resolveDropFolderId(targetFolderId);
  const inTarget = media.filter((m) => (m.folder_id ?? null) === target);
  let nextOrder = inTarget.length > 0 ? Math.max(...inTarget.map((m) => m.display_order ?? 0)) + 1 : 0;

  return media.map((m) => {
    if (!itemKeys.has(mediaKey(m))) return m;
    const updated = { ...m, folder_id: target, display_order: nextOrder };
    nextOrder += 1;
    return updated;
  });
}

export function copyMediaItems(
  media: ExplorerMediaItem[],
  items: ExplorerMediaItem[],
  targetFolderId: string | null
): ExplorerMediaItem[] {
  const target = resolveDropFolderId(targetFolderId);
  const inTarget = media.filter((m) => (m.folder_id ?? null) === target);
  let nextOrder = inTarget.length > 0 ? Math.max(...inTarget.map((m) => m.display_order ?? 0)) + 1 : 0;

  const copies = items.map((item) => ({
    ...item,
    id: undefined,
    folder_id: target,
    display_order: nextOrder++,
  }));

  return [...media, ...copies];
}

export function removeMediaKeys(media: ExplorerMediaItem[], keys: Set<string>): ExplorerMediaItem[] {
  return media.filter((m) => !keys.has(mediaKey(m)));
}
