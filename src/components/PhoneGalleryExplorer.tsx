import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FolderPhotoGallery from '@/components/ui/folder-photo-gallery';
import { GalleryFolderGrid } from '@/components/ui/gallery-folder-card';
import { PageHeroBackground } from '@/components/ui/page-hero-background';
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

  const breadcrumb = useMemo(() => {
    if (level === 'roots') return 'Albums';
    if (level === 'subfolders') return currentRoot?.name ?? 'Albums';
    if (displayFolderId === UNCategorized_FOLDER_ID) return uncategorizedLabel;
    const active = displayFolderId ? enabledFolders.find((f) => f.id === displayFolderId) : null;
    if (!active) return 'Albums';
    if (active.parent_id && currentRoot?.name) {
      return `${currentRoot.name} / ${active.name}`;
    }
    return active.name;
  }, [level, currentRoot?.name, displayFolderId, enabledFolders, uncategorizedLabel]);

  const albumTitle = useMemo(() => {
    if (level !== 'photos') return null;
    if (displayFolderId === UNCategorized_FOLDER_ID) return uncategorizedLabel;
    const active = displayFolderId ? enabledFolders.find((f) => f.id === displayFolderId) : null;
    return active?.name ?? 'Album';
  }, [level, displayFolderId, enabledFolders, uncategorizedLabel]);

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
        onClick: () => openRoot(node.folder.id),
      };
    });

    if (uncategorized.length > 0) {
      cards.push({
        id: UNCategorized_FOLDER_ID,
        name: uncategorizedLabel,
        count: uncategorized.length,
        coverUrl: getFolderCoverUrl(UNCategorized_FOLDER_ID, enabledFolders, media, resolveUrl),
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
        onClick: () => openSubfolder(sf.id),
      })),
    [subfolders, enabledFolders, media, resolveUrl],
  );

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border/50 bg-card/20 p-3 sm:p-4 md:p-5">
      <PageHeroBackground intensity="live" className="rounded-2xl" />
      <div className="relative z-[1]">
      {level !== 'roots' ? (
        <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-medium hover:scale-100"
            onClick={goBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{breadcrumb}</span>
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">Browse photos and videos by album.</p>
      )}

      {level === 'roots' && <GalleryFolderGrid folders={rootFolderCards} />}

      {level === 'subfolders' && rootId && <GalleryFolderGrid folders={subfolderCards} />}

      {level === 'photos' && (
        <div className="space-y-4">
          {photos.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
              No photos or videos in this album
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold text-foreground sm:text-xl">{albumTitle}</h3>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {photos.length === 1 ? '1 item' : `${photos.length} items`}
                </span>
              </div>
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
            </>
          )}
        </div>
      )}

      {level === 'roots' && visibleRoots.length === 0 && uncategorized.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Gallery coming soon
        </div>
      ) : null}
      </div>
    </div>
  );
}
