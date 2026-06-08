import { useMemo, useState } from 'react';
import { ArrowLeft, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FolderPhotoGallery from '@/components/ui/folder-photo-gallery';
import { GalleryFolderGrid } from '@/components/ui/gallery-folder-card';
import {
  buildFolderTree,
  folderHasVisibleContent,
  getFolderCoverUrl,
  getMediaInFolder,
  UNCategorized_FOLDER_ID,
  type ExplorerFolder,
  type ExplorerMediaItem,
} from '@/lib/mediaFolderTree';

type GalleryLevel = 'roots' | 'subfolders' | 'photos';

type PhoneGalleryExplorerProps<T extends ExplorerMediaItem> = {
  folders: ExplorerFolder[];
  media: T[];
  resolveUrl: (url: string) => string;
  onOpenLightbox: (index: number, orderedMedia: T[]) => void;
  isVideo?: (item: T) => boolean;
  getPoster?: (item: T) => string;
  uncategorizedLabel?: string;
};

export default function PhoneGalleryExplorer<T extends ExplorerMediaItem>({
  folders,
  media,
  resolveUrl,
  onOpenLightbox,
  isVideo = (item) => item.media_type === 'video',
  getPoster,
  uncategorizedLabel = 'Other',
}: PhoneGalleryExplorerProps<T>) {
  const [level, setLevel] = useState<GalleryLevel>('roots');
  const [rootId, setRootId] = useState<string | null>(null);
  const [subfolderId, setSubfolderId] = useState<string | null>(null);

  const enabledFolders = useMemo(
    () => folders.filter((f) => f.is_enabled !== false),
    [folders]
  );

  const tree = useMemo(() => buildFolderTree(enabledFolders), [enabledFolders]);

  const visibleRoots = useMemo(
    () =>
      tree.filter(
        (node) =>
          folderHasVisibleContent(node.folder.id, enabledFolders, media) ||
          node.children.some((c) => folderHasVisibleContent(c.folder.id, enabledFolders, media))
      ),
    [tree, enabledFolders, media]
  );

  const currentRoot = rootId ? enabledFolders.find((f) => f.id === rootId) : null;
  const subfolders = useMemo(() => {
    if (!rootId) return [];
    return enabledFolders
      .filter((f) => f.parent_id === rootId && folderHasVisibleContent(f.id, enabledFolders, media))
      .sort((a, b) => a.display_order - b.display_order);
  }, [rootId, enabledFolders, media]);

  const displayFolderId =
    level === 'photos' ? subfolderId ?? (subfolders.length === 0 ? rootId : subfolderId) : null;

  const photos = useMemo(() => {
    if (level !== 'photos' || !displayFolderId) return [] as T[];
    return getMediaInFolder(displayFolderId, media) as T[];
  }, [level, displayFolderId, media]);

  const uncategorized = useMemo(
    () => getMediaInFolder(UNCategorized_FOLDER_ID, media) as T[],
    [media]
  );

  const openRoot = (id: string) => {
    setRootId(id);
    const subs = enabledFolders.filter(
      (f) => f.parent_id === id && folderHasVisibleContent(f.id, enabledFolders, media)
    );
    if (subs.length > 0) {
      setLevel('subfolders');
    } else {
      setSubfolderId(null);
      setLevel('photos');
    }
  };

  const openSubfolder = (id: string) => {
    setSubfolderId(id);
    setLevel('photos');
  };

  const goBack = () => {
    if (level === 'photos') {
      if (subfolders.length > 0 && subfolderId) {
        setSubfolderId(null);
        setLevel('subfolders');
      } else {
        setRootId(null);
        setLevel('roots');
      }
    } else if (level === 'subfolders') {
      setRootId(null);
      setLevel('roots');
    }
  };

  const breadcrumb =
    level === 'roots'
      ? 'Gallery'
      : level === 'subfolders'
        ? currentRoot?.name ?? 'Gallery'
        : [currentRoot?.name, enabledFolders.find((f) => f.id === displayFolderId)?.name].filter(Boolean).join(' / ');

  const rootFolderCards = useMemo(() => {
    const cards = visibleRoots.map((node) => {
      const count =
        getMediaInFolder(node.folder.id, media).length +
        enabledFolders
          .filter((f) => f.parent_id === node.folder.id)
          .reduce((sum, sf) => sum + getMediaInFolder(sf.id, media).length, 0);
      return {
        id: node.folder.id,
        name: node.folder.name,
        count,
        coverUrl: getFolderCoverUrl(node.folder.id, enabledFolders, media, resolveUrl),
        description: 'Virtual tour album',
        onClick: () => openRoot(node.folder.id),
      };
    });

    if (uncategorized.length > 0) {
      cards.push({
        id: UNCategorized_FOLDER_ID,
        name: uncategorizedLabel,
        count: uncategorized.length,
        coverUrl: getFolderCoverUrl(UNCategorized_FOLDER_ID, enabledFolders, media, resolveUrl),
        description: 'Photos not in a folder',
        onClick: () => {
          setRootId(null);
          setSubfolderId(UNCategorized_FOLDER_ID);
          setLevel('photos');
        },
      });
    }

    return cards;
  }, [visibleRoots, enabledFolders, media, resolveUrl, uncategorized, uncategorizedLabel]);

  const subfolderCards = useMemo(
    () =>
      subfolders.map((sf) => ({
        id: sf.id,
        name: sf.name,
        count: getMediaInFolder(sf.id, media).length,
        coverUrl: getFolderCoverUrl(sf.id, enabledFolders, media, resolveUrl),
        description: currentRoot?.name ? `Inside ${currentRoot.name}` : 'Subfolder',
        onClick: () => openSubfolder(sf.id),
      })),
    [subfolders, enabledFolders, media, resolveUrl, currentRoot?.name],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {level !== 'roots' ? (
          <Button type="button" variant="ghost" size="sm" className="gap-1 px-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground">
          <Images className="h-4 w-4 shrink-0" />
          <span className="truncate font-medium text-foreground">{breadcrumb}</span>
        </div>
      </div>

      {level === 'roots' && <GalleryFolderGrid folders={rootFolderCards} />}

      {level === 'subfolders' && rootId && <GalleryFolderGrid folders={subfolderCards} />}

      {level === 'photos' && (
        <>
          {photos.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-muted bg-muted/20 text-sm text-muted-foreground">
              No photos or videos in this folder
            </div>
          ) : (
            <FolderPhotoGallery
              items={photos.map((item, i) => ({
                id: item.id ?? `${item.url}-${i}`,
                posterSrc: getPoster ? getPoster(item) : resolveUrl(item.url),
                alt: item.caption ?? 'Gallery',
                caption: item.caption ?? undefined,
                isVideo: isVideo(item),
              }))}
              onItemClick={(index) => onOpenLightbox(index, photos)}
            />
          )}
        </>
      )}

      {level === 'roots' && visibleRoots.length === 0 && uncategorized.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">Gallery coming soon</div>
      ) : null}
    </div>
  );
}
