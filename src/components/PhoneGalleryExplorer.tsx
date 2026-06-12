import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FolderPhotoGallery from '@/components/ui/folder-photo-gallery';
import { GalleryFolderGrid } from '@/components/ui/gallery-folder-card';
import { MobileGalleryFolderGrid } from '@/components/ui/mobile-gallery-folder-grid';
import { MobileGalleryPhotoGrid } from '@/components/ui/mobile-gallery-photo-grid';
import { PageHeroBackground } from '@/components/ui/page-hero-background';
import {
  buildFolderTree,
  folderHasVisibleContent,
  getFolderCoverUrl,
  getFolderPreviewUrls,
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

type FolderCardData = {
  id: string;
  name: string;
  count: number;
  coverUrl?: string | null;
  previewUrls: string[];
  onClick: () => void;
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

  const getPreviewUrls = (folderId: string) => {
    const urls = getFolderPreviewUrls(folderId, enabledFolders, media, resolveUrl, 4);
    if (urls.length > 0) return urls;
    const cover = getFolderCoverUrl(folderId, enabledFolders, media, resolveUrl);
    return cover ? [cover] : [];
  };

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

  const buildFolderCard = (
    id: string,
    name: string,
    count: number,
    onClick: () => void
  ): FolderCardData => ({
    id,
    name,
    count,
    coverUrl: getFolderCoverUrl(id, enabledFolders, media, resolveUrl),
    previewUrls: getPreviewUrls(id),
    onClick,
  });

  const rootFolderCards = useMemo(() => {
    const cards: FolderCardData[] = visibleRoots.map((node) => {
      const count =
        getMediaInFolder(node.folder.id, media).length +
        enabledFolders
          .filter((f) => f.parent_id === node.folder.id)
          .reduce((sum, sf) => sum + getMediaInFolder(sf.id, media).length, 0);
      return buildFolderCard(node.folder.id, node.folder.name, count, () => openRoot(node.folder.id));
    });

    if (uncategorized.length > 0) {
      cards.push(
        buildFolderCard(UNCategorized_FOLDER_ID, uncategorizedLabel, uncategorized.length, () => {
          setRootId(null);
          setSubfolderId(UNCategorized_FOLDER_ID);
          setLevel('photos');
        })
      );
    }

    return cards;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- openRoot is stable within render
  }, [visibleRoots, enabledFolders, media, resolveUrl, uncategorized, uncategorizedLabel]);

  const subfolderCards = useMemo(
    () =>
      subfolders.map((sf) =>
        buildFolderCard(sf.id, sf.name, getMediaInFolder(sf.id, media).length, () => openSubfolder(sf.id))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subfolders, enabledFolders, media, resolveUrl]
  );

  const photoItems = useMemo(
    () =>
      photos.map((item, i) => ({
        id: item.id ?? `${item.url}-${i}`,
        posterSrc: getPoster ? getPoster(item) : resolveUrl(item.url),
        alt: item.caption ?? 'Gallery',
        caption: item.caption ?? undefined,
        isVideo: isVideo(item),
      })),
    [photos, getPoster, resolveUrl, isVideo]
  );

  const desktopFolderCards = rootFolderCards.map(({ id, name, count, coverUrl, onClick }) => ({
    id,
    name,
    count,
    coverUrl,
    onClick,
  }));

  const desktopSubfolderCards = subfolderCards.map(({ id, name, count, coverUrl, onClick }) => ({
    id,
    name,
    count,
    coverUrl,
    onClick,
  }));

  const mobileFolderCards = (cards: FolderCardData[]) =>
    cards.map(({ id, name, count, previewUrls, onClick }) => ({
      id,
      name,
      count,
      previewUrls,
      onClick,
    }));

  return (
    <div className="relative isolate overflow-hidden md:rounded-2xl md:border md:border-border/50 md:bg-card/20 md:p-4 lg:p-5">
      <PageHeroBackground intensity="live" className="hidden md:block md:rounded-2xl" />
      <div className="relative z-[1] md:p-0">
        {level !== 'roots' ? (
          <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3 md:mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 min-w-[44px] shrink-0 gap-1.5 rounded-xl px-3 text-sm font-medium hover:scale-100 md:h-8 md:min-w-0 md:rounded-lg md:px-2.5 md:text-xs"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span className="md:inline">Back</span>
            </Button>
            <span className="min-w-0 truncate text-base font-medium text-foreground md:text-sm">{breadcrumb}</span>
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground md:mb-4">Browse photos and videos by album.</p>
        )}

        {level === 'roots' && (
          <>
            <div className="md:hidden">
              <MobileGalleryFolderGrid folders={mobileFolderCards(rootFolderCards)} />
            </div>
            <div className="hidden md:block">
              <GalleryFolderGrid folders={desktopFolderCards} />
            </div>
          </>
        )}

        {level === 'subfolders' && rootId && (
          <>
            <div className="md:hidden">
              <MobileGalleryFolderGrid folders={mobileFolderCards(subfolderCards)} />
            </div>
            <div className="hidden md:block">
              <GalleryFolderGrid folders={desktopSubfolderCards} />
            </div>
          </>
        )}

        {level === 'photos' && (
          <div className="space-y-3 md:space-y-4">
            {photos.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                No photos or videos in this album
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-3 px-0 md:px-0">
                  <h3 className="font-serif text-lg font-semibold text-foreground md:text-xl">{albumTitle}</h3>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {photos.length === 1 ? '1 item' : `${photos.length} items`}
                  </span>
                </div>
                <div className="-mx-4 md:mx-0">
                  <div className="md:hidden">
                    <MobileGalleryPhotoGrid
                      items={photoItems}
                      onItemClick={(index) => onOpenLightbox(index, photos)}
                    />
                  </div>
                  <div className="hidden md:block">
                    <FolderPhotoGallery
                      items={photoItems}
                      onItemClick={(index) => onOpenLightbox(index, photos)}
                    />
                  </div>
                </div>
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
