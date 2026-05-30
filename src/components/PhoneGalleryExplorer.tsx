import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FolderOpen, Images, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const renderCoverTile = (
    folderId: string,
    name: string,
    count: number,
    onClick: () => void,
    delay: number
  ) => {
    const cover = getFolderCoverUrl(folderId, enabledFolders, media, resolveUrl);
    return (
      <motion.button
        key={folderId}
        type="button"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        onClick={onClick}
        className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted text-left shadow-sm"
      >
        {cover ? (
          <img src={cover} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-semibold text-white drop-shadow">{name}</p>
          <p className="text-xs text-white/80">{count} items</p>
        </div>
      </motion.button>
    );
  };

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

      {level === 'roots' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleRoots.map((node, i) => {
            const count =
              getMediaInFolder(node.folder.id, media).length +
              enabledFolders
                .filter((f) => f.parent_id === node.folder.id)
                .reduce((sum, sf) => sum + getMediaInFolder(sf.id, media).length, 0);
            return renderCoverTile(node.folder.id, node.folder.name, count, () => openRoot(node.folder.id), i * 0.04);
          })}
          {uncategorized.length > 0
            ? renderCoverTile(
                UNCategorized_FOLDER_ID,
                uncategorizedLabel,
                uncategorized.length,
                () => {
                  setRootId(null);
                  setSubfolderId(UNCategorized_FOLDER_ID);
                  setLevel('photos');
                },
                visibleRoots.length * 0.04
              )
            : null}
        </div>
      )}

      {level === 'subfolders' && rootId && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {subfolders.map((sf, i) =>
            renderCoverTile(
              sf.id,
              sf.name,
              getMediaInFolder(sf.id, media).length,
              () => openSubfolder(sf.id),
              i * 0.04
            )
          )}
        </div>
      )}

      {level === 'photos' && (
        <>
          {photos.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-muted bg-muted/20 text-sm text-muted-foreground">
              No photos or videos in this folder
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((item, i) => {
                const video = isVideo(item);
                const src = resolveUrl(item.url);
                const poster = getPoster ? getPoster(item) : src;
                return (
                  <motion.button
                    key={item.id ?? `${item.url}-${i}`}
                    type="button"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.02 }}
                    className="relative aspect-square overflow-hidden rounded-xl"
                    onClick={() => onOpenLightbox(i, photos)}
                  >
                    <img src={poster} alt={item.caption || 'Gallery'} className="h-full w-full object-cover" loading="lazy" />
                    {video ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Play className="h-10 w-10 text-white" fill="currentColor" />
                      </div>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          )}
        </>
      )}

      {level === 'roots' && visibleRoots.length === 0 && uncategorized.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">Gallery coming soon</div>
      ) : null}
    </div>
  );
}
