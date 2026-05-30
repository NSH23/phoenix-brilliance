export type ExplorerFolder = {
  id: string;
  parent_id: string | null;
  name: string;
  display_order: number;
  is_enabled: boolean;
  cover_image_url?: string | null;
};

export type ExplorerMediaItem = {
  id?: string;
  url: string;
  folder_id: string | null;
  display_order: number;
  media_type: 'image' | 'video';
  caption?: string | null;
};

export const UNCategorized_FOLDER_ID = '__uncategorized__';
export const GALLERY_ROOT_ID = '__gallery_root__';

export type FolderTreeNode = {
  folder: ExplorerFolder;
  children: FolderTreeNode[];
};

export function buildFolderTree(folders: ExplorerFolder[]): FolderTreeNode[] {
  const roots = folders
    .filter((f) => !f.parent_id)
    .sort((a, b) => a.display_order - b.display_order);
  const byParent = new Map<string, ExplorerFolder[]>();
  folders
    .filter((f) => f.parent_id)
    .forEach((f) => {
      const list = byParent.get(f.parent_id!) ?? [];
      list.push(f);
      byParent.set(f.parent_id!, list);
    });
  byParent.forEach((list) => list.sort((a, b) => a.display_order - b.display_order));

  const build = (folder: ExplorerFolder): FolderTreeNode => ({
    folder,
    children: (byParent.get(folder.id) ?? []).map(build),
  });

  return roots.map(build);
}

export function getFolderBreadcrumb(folderId: string | null, folders: ExplorerFolder[]): ExplorerFolder[] {
  if (!folderId || folderId === UNCategorized_FOLDER_ID) return [];
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: ExplorerFolder[] = [];
  let current = byId.get(folderId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

export function getMediaInFolder(
  folderId: string | null,
  media: ExplorerMediaItem[]
): ExplorerMediaItem[] {
  const target = folderId === UNCategorized_FOLDER_ID ? null : folderId;
  return media
    .filter((m) => (m.folder_id ?? null) === target)
    .sort((a, b) => a.display_order - b.display_order);
}

export function getFolderCoverUrl(
  folderId: string,
  folders: ExplorerFolder[],
  media: ExplorerMediaItem[],
  resolveUrl: (url: string) => string
): string | null {
  const folder = folders.find((f) => f.id === folderId);
  if (folder?.cover_image_url) return resolveUrl(folder.cover_image_url);
  const firstImage = getMediaInFolder(folderId, media).find((m) => m.media_type === 'image');
  if (firstImage) return resolveUrl(firstImage.url);
  return null;
}

export function folderHasVisibleContent(
  folderId: string,
  folders: ExplorerFolder[],
  media: ExplorerMediaItem[]
): boolean {
  if (getMediaInFolder(folderId, media).length > 0) return true;
  return folders
    .filter((f) => f.parent_id === folderId && f.is_enabled !== false)
    .some((child) => folderHasVisibleContent(child.id, folders, media));
}
