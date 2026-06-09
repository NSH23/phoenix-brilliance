import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Pencil,
  Scissors,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { optimizeMediaUrl } from '@/lib/mediaDelivery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import ImageUpload from '@/components/admin/ImageUpload';
import {
  copyMediaItems,
  mediaKey,
  moveMediaItems,
  resolveDropFolderId,
  type MediaClipboard,
} from '@/lib/explorerMediaOps';
import { uploadToCloudinary, type BucketName } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';
import { useIsMobile } from '@/hooks/use-mobile';
import { adminDialogMobileClass } from '@/components/admin/adminStyles';
import { toast } from 'sonner';
import {
  buildFolderTree,
  GALLERY_ROOT_ID,
  getFolderBreadcrumb,
  getMediaInFolder,
  UNCategorized_FOLDER_ID,
  type ExplorerFolder,
  type ExplorerMediaItem,
  type FolderTreeNode,
} from '@/lib/mediaFolderTree';

export type AdminMediaExplorerProps = {
  folders: ExplorerFolder[];
  media: ExplorerMediaItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChange: (folders: ExplorerFolder[]) => void;
  onMediaChange: (media: ExplorerMediaItem[]) => void;
  uploadBucket: string;
  onCreateRootFolder: (name: string) => Promise<void>;
  onCreateSubfolder: (parentId: string, name: string) => Promise<void>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onSeedStandardFolders?: () => Promise<void>;
  creatingFolder?: boolean;
  /** When false, uploads stay local until Save changes. */
  autosaveEnabled?: boolean;
  /** Persist gallery; receives current media/folders snapshot (avoids stale React state). */
  onAutosave?: (snapshot: { media: ExplorerMediaItem[]; folders: ExplorerFolder[] }) => void | Promise<void>;
  /** Always persist deletes to the database (independent of autosave toggle). */
  onPersistSnapshot?: (snapshot: { media: ExplorerMediaItem[]; folders: ExplorerFolder[] }) => void | Promise<void>;
};

export type MediaAutosaveSnapshot = { media: ExplorerMediaItem[]; folders: ExplorerFolder[] };

const LONG_PRESS_MS = 480;

function isExternalFileDrag(e: React.DragEvent) {
  return e.dataTransfer.types.includes('Files');
}

function NavTreeRow({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
  mediaCounts,
}: {
  node: FolderTreeNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  mediaCounts: Map<string, number>;
}) {
  const { folder, children } = node;
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(folder.id);
  const selected = selectedId === folder.id;
  const count = mediaCounts.get(folder.id) ?? 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-0.5 rounded-md py-1 pr-1 text-[13px] transition-colors',
          selected ? 'bg-primary/12 text-primary' : 'hover:bg-muted/70'
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
          onClick={() => (hasChildren ? onToggleExpand(folder.id) : onSelect(folder.id))}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            <span className="w-3" />
          )}
        </button>
        <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5 text-left" onClick={() => onSelect(folder.id)}>
          {expanded || selected ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{folder.name}</span>
          {count > 0 ? <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{count}</span> : null}
        </button>
      </div>
      {hasChildren && expanded
        ? children.map((child) => (
            <NavTreeRow
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              mediaCounts={mediaCounts}
            />
          ))
        : null}
    </div>
  );
}

function FolderTile({
  name,
  count,
  selected,
  onSelect,
  onOpen,
  hidden,
  folderId,
  isDropTarget,
  onDragOverFolder,
  onDragLeaveFolder,
  onDropOnFolder,
  onPaste,
  onRename,
  onDelete,
  canDelete,
  hasClipboard,
  isMobile,
  folderSelectionMode,
  onFolderLongPress,
  suppressClickRef,
}: {
  name: string;
  count: number;
  selected?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onOpen: () => void;
  hidden?: boolean;
  folderId: string;
  isDropTarget?: boolean;
  onDragOverFolder: (folderId: string | null, external: boolean) => void;
  onDragLeaveFolder: () => void;
  onDropOnFolder: (folderId: string | null, files: FileList | null) => void;
  onPaste?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  hasClipboard?: boolean;
  isMobile?: boolean;
  folderSelectionMode?: boolean;
  onFolderLongPress?: () => void;
  suppressClickRef?: React.MutableRefObject<boolean>;
}) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const cancelLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
    touchStartRef.current = null;
  };

  const handleFolderClick = (e: React.MouseEvent) => {
    if (suppressClickRef?.current) {
      suppressClickRef.current = false;
      return;
    }
    if (isMobile && folderSelectionMode) {
      onSelect(e);
      return;
    }
    if (isMobile) {
      onOpen();
      return;
    }
    onSelect(e);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isMobile || !onFolderLongPress || e.button !== 0) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      onFolderLongPress();
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!touchStartRef.current || !longPressTimerRef.current) return;
    const dx = Math.abs(e.clientX - touchStartRef.current.x);
    const dy = Math.abs(e.clientY - touchStartRef.current.y);
    if (dx > 12 || dy > 12) cancelLongPress();
  };

  const tile = (
    <div
      data-explorer-item="folder"
      role="button"
      tabIndex={0}
      onClick={handleFolderClick}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerMove={handlePointerMove}
      onDoubleClick={(e) => {
        e.preventDefault();
        if (!isMobile) onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOverFolder(folderId, isExternalFileDrag(e));
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragLeaveFolder();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropOnFolder(folderId, e.dataTransfer.files?.length ? e.dataTransfer.files : null);
      }}
      className={cn(
        'group flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:border-border/60 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        selected ? 'border-primary bg-primary/8 ring-2 ring-primary/35' : 'border-transparent',
        isDropTarget ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : ''
      )}
    >
      <div className="relative">
        <Folder className="h-12 w-12 text-amber-500/90 transition-transform group-hover:scale-105" fill="currentColor" />
        {hidden ? <EyeOff className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-background text-muted-foreground" /> : null}
      </div>
      <div className="min-w-0 w-full">
        <p className="truncate text-xs font-medium text-foreground">{name}</p>
        <p className="text-[10px] text-muted-foreground">{count} item{count === 1 ? '' : 's'}</p>
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{tile}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onOpen}>
          <FolderOpen className="mr-2 h-4 w-4" /> Open
        </ContextMenuItem>
        {hasClipboard && onPaste ? (
          <ContextMenuItem onClick={onPaste}>
            <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
          </ContextMenuItem>
        ) : null}
        {onRename ? (
          <ContextMenuItem onClick={onRename}>
            <Pencil className="mr-2 h-4 w-4" /> Rename
          </ContextMenuItem>
        ) : null}
        {canDelete && onDelete ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete folder
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function AdminMediaExplorer({
  folders,
  media,
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
  onMediaChange,
  uploadBucket,
  onCreateRootFolder,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onSeedStandardFolders,
  creatingFolder = false,
  autosaveEnabled = true,
  onAutosave,
  onPersistSnapshot,
}: AdminMediaExplorerProps) {
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAutosaveRef = useRef<MediaAutosaveSnapshot | null>(null);

  const runAutosaveNow = (snapshot: MediaAutosaveSnapshot) => {
    if (!onAutosave) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    pendingAutosaveRef.current = null;
    void Promise.resolve(onAutosave(snapshot));
  };

  const triggerAutosave = (snapshot: MediaAutosaveSnapshot, options?: { immediate?: boolean }) => {
    if (!autosaveEnabled || !onAutosave) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    pendingAutosaveRef.current = snapshot;
    if (options?.immediate) {
      runAutosaveNow(snapshot);
      return;
    }
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      const snap = pendingAutosaveRef.current;
      pendingAutosaveRef.current = null;
      if (snap) void Promise.resolve(onAutosave(snap));
    }, 700);
  };

  /** Deletes must hit the database immediately — independent of the autosave toggle. */
  const persistAfterDelete = (snapshot: MediaAutosaveSnapshot) => {
    const persist = onPersistSnapshot ?? onAutosave;
    if (!persist) {
      toast.error('Could not save delete', {
        description: 'Save changes manually or turn on gallery autosave.',
      });
      return;
    }
    void Promise.resolve(persist(snapshot)).catch((err: unknown) => {
      toast.error('Could not delete from database', {
        description: err instanceof Error ? err.message : String(err),
      });
    });
  };

  useEffect(
    () => () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    },
    []
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderMode, setNewFolderMode] = useState<'category' | 'subfolder'>('category');
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [clipboard, setClipboard] = useState<MediaClipboard>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedFolderTileIds, setSelectedFolderTileIds] = useState<Set<string>>(new Set());
  const lastSelectedFileKey = useRef<string | null>(null);
  const lastSelectedFolderTileId = useRef<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggingKeys, setDraggingKeys] = useState<Set<string>>(new Set());
  const [externalDragOver, setExternalDragOver] = useState<string | null>(null);
  const [externalUploading, setExternalUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBatch, setUploadBatch] = useState<{ current: number; total: number; name: string } | null>(null);
  const isMobile = useIsMobile();
  const [mobileFileSelectMode, setMobileFileSelectMode] = useState(false);
  const [mobileFolderSelectMode, setMobileFolderSelectMode] = useState(false);
  const [previewItem, setPreviewItem] = useState<ExplorerMediaItem | null>(null);
  const fileLongPressItemRef = useRef<ExplorerMediaItem | null>(null);
  const fileLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  const tree = useMemo(() => buildFolderTree(folders), [folders]);

  const mediaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    folders.forEach((f) => counts.set(f.id, getMediaInFolder(f.id, media).length));
    counts.set(UNCategorized_FOLDER_ID, getMediaInFolder(UNCategorized_FOLDER_ID, media).length);
    return counts;
  }, [folders, media]);

  const folderDescendantCounts = useMemo(() => {
    const total = new Map<string, number>();
    const direct = (id: string) => mediaCounts.get(id) ?? 0;
    const walk = (folderId: string): number => {
      let sum = direct(folderId);
      folders.filter((f) => f.parent_id === folderId).forEach((child) => {
        sum += walk(child.id);
      });
      total.set(folderId, sum);
      return sum;
    };
    folders.filter((f) => !f.parent_id).forEach((root) => walk(root.id));
    return total;
  }, [folders, mediaCounts]);

  const isAtRoot = selectedFolderId === GALLERY_ROOT_ID || selectedFolderId === null;

  const selectedFolder =
    selectedFolderId && selectedFolderId !== GALLERY_ROOT_ID
      ? folders.find((f) => f.id === selectedFolderId)
      : null;

  const breadcrumb = useMemo(() => {
    if (isAtRoot) return [];
    return getFolderBreadcrumb(selectedFolderId, folders);
  }, [isAtRoot, selectedFolderId, folders]);

  const childFolders = useMemo(() => {
    if (isAtRoot) return folders.filter((f) => !f.parent_id).sort((a, b) => a.display_order - b.display_order);
    if (selectedFolder) return folders.filter((f) => f.parent_id === selectedFolder.id).sort((a, b) => a.display_order - b.display_order);
    return [];
  }, [isAtRoot, selectedFolder, folders]);

  const folderMedia = useMemo(() => {
    if (isAtRoot) return [] as ExplorerMediaItem[];
    return getMediaInFolder(selectedFolderId, media);
  }, [isAtRoot, selectedFolderId, media]);

  const unassignedMedia = useMemo(
    () => getMediaInFolder(UNCategorized_FOLDER_ID, media),
    [media]
  );

  useEffect(() => {
    if (selectedFolderId === UNCategorized_FOLDER_ID) onSelectFolder(GALLERY_ROOT_ID);
  }, [selectedFolderId, onSelectFolder]);

  const imageUrls = folderMedia.filter((m) => m.media_type !== 'video').map((m) => m.url);
  const videos = folderMedia.filter((m) => m.media_type === 'video');

  const canCreateFolder = isAtRoot || !!selectedFolder;
  const canUpload = !isAtRoot;
  const contentTargetId = isAtRoot ? GALLERY_ROOT_ID : selectedFolderId;

  const visibleFolderTileIds = useMemo(() => childFolders.map((f) => f.id), [childFolders]);

  useEffect(() => {
    if (!selectedFolderId || selectedFolderId === GALLERY_ROOT_ID || selectedFolderId === UNCategorized_FOLDER_ID) return;
    const path = getFolderBreadcrumb(selectedFolderId, folders);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      path.slice(0, -1).forEach((f) => next.add(f.id));
      return next;
    });
  }, [selectedFolderId, folders]);

  const clearSelection = () => {
    setSelectedKeys(new Set());
    setSelectedFolderTileIds(new Set());
    lastSelectedFileKey.current = null;
    lastSelectedFolderTileId.current = null;
  };

  const exitMobileSelectMode = () => {
    clearSelection();
    setMobileFileSelectMode(false);
    setMobileFolderSelectMode(false);
  };

  const enterFileSelectMode = (item: ExplorerMediaItem) => {
    const key = mediaKey(item);
    setMobileFileSelectMode(true);
    setMobileFolderSelectMode(false);
    setSelectedFolderTileIds(new Set());
    setSelectedKeys(new Set([key]));
    lastSelectedFileKey.current = key;
    suppressNextClickRef.current = true;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  const enterFolderSelectMode = (folderId: string) => {
    setMobileFolderSelectMode(true);
    setMobileFileSelectMode(false);
    setSelectedKeys(new Set());
    setSelectedFolderTileIds(new Set([folderId]));
    lastSelectedFolderTileId.current = folderId;
    suppressNextClickRef.current = true;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
  };

  const cancelFileLongPress = () => {
    if (fileLongPressTimerRef.current) clearTimeout(fileLongPressTimerRef.current);
    fileLongPressTimerRef.current = null;
    fileTouchStartRef.current = null;
    fileLongPressItemRef.current = null;
  };

  const handleFilePointerDown = (item: ExplorerMediaItem) => (e: React.PointerEvent) => {
    if (!isMobile || e.button !== 0) return;
    fileLongPressItemRef.current = item;
    fileTouchStartRef.current = { x: e.clientX, y: e.clientY };
    fileLongPressTimerRef.current = setTimeout(() => {
      fileLongPressTimerRef.current = null;
      const target = fileLongPressItemRef.current;
      if (target) enterFileSelectMode(target);
    }, LONG_PRESS_MS);
  };

  const handleFilePointerMove = (e: React.PointerEvent) => {
    if (!fileTouchStartRef.current || !fileLongPressTimerRef.current) return;
    const dx = Math.abs(e.clientX - fileTouchStartRef.current.x);
    const dy = Math.abs(e.clientY - fileTouchStartRef.current.y);
    if (dx > 12 || dy > 12) cancelFileLongPress();
  };

  useEffect(
    () => () => {
      if (fileLongPressTimerRef.current) clearTimeout(fileLongPressTimerRef.current);
    },
    []
  );

  const deleteSelectedFolderTile = () => {
    if (selectedFolderTileIds.size !== 1) return;
    const folderId = [...selectedFolderTileIds][0];
    void onDeleteFolder(folderId).then(() => exitMobileSelectMode());
  };

  const openRenameFolderDialog = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    setRenameFolderId(folderId);
    setRenameFolderName(folder.name);
    setRenameFolderOpen(true);
  };

  const renameSelectedFolderTile = () => {
    if (selectedFolderTileIds.size !== 1) return;
    openRenameFolderDialog([...selectedFolderTileIds][0]);
  };

  const submitRenameFolder = async () => {
    const name = renameFolderName.trim();
    if (!name) {
      toast.error('Enter a folder name');
      return;
    }
    if (!renameFolderId) return;
    const existing = folders.find((f) => f.id === renameFolderId);
    if (existing?.name === name) {
      setRenameFolderOpen(false);
      setRenameFolderId(null);
      setRenameFolderName('');
      return;
    }
    setRenamingFolder(true);
    try {
      await onRenameFolder(renameFolderId, name);
      setRenameFolderOpen(false);
      setRenameFolderId(null);
      setRenameFolderName('');
      exitMobileSelectMode();
    } catch {
      // Parent shows error toast
    } finally {
      setRenamingFolder(false);
    }
  };

  const deleteAllUnassigned = () => {
    const count = unassignedMedia.length;
    if (!count) return;
    if (!confirm(`Delete ${count} file${count === 1 ? '' : 's'} not in any folder?`)) return;
    const keys = new Set(unassignedMedia.map(mediaKey));
    const nextMedia = media.filter((m) => !keys.has(mediaKey(m)));
    onMediaChange(nextMedia);
    persistAfterDelete({ media: nextMedia, folders });
    exitMobileSelectMode();
    toast.success(`Removed ${count} file${count === 1 ? '' : 's'}`);
  };

  const deleteSelectedFiles = () => {
    const items = getItemsByKeys(selectedKeys);
    if (!items.length) return;
    const deletingUnassignedOnly = items.every((i) => (i.folder_id ?? null) === null);
    if (deletingUnassignedOnly) {
      const keys = selectedKeys;
      const nextMedia = media.filter((m) => !keys.has(mediaKey(m)));
      onMediaChange(nextMedia);
      persistAfterDelete({ media: nextMedia, folders });
      exitMobileSelectMode();
      toast.success(`Removed ${items.length} file${items.length === 1 ? '' : 's'}`);
      return;
    }
    const urlsToRemove = new Set(items.filter((i) => i.media_type !== 'video').map((i) => i.url));
    for (const item of items) {
      if (item.media_type === 'video') removeVideo(item.url, item.folder_id ?? null);
    }
    if (urlsToRemove.size > 0) {
      const folderId = selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId;
      const others = media.filter((m) => (m.folder_id ?? null) !== folderId);
      const existingInFolder = media.filter((m) => (m.folder_id ?? null) === folderId);
      const videosInFolder = existingInFolder.filter((m) => m.media_type === 'video');
      const keptUrls = imageUrls.filter((u) => !urlsToRemove.has(u));
      const merged = keptUrls.map((url, i) => {
        const found = existingInFolder.find((e) => e.url === url && e.media_type === 'image');
        return found
          ? { ...found, display_order: i }
          : { url, folder_id: folderId, display_order: i, media_type: 'image' as const, caption: null };
      });
      const base = merged.length;
      const videosAdjusted = videosInFolder.map((v, i) => ({ ...v, folder_id: folderId, display_order: base + i }));
      const nextMedia = [...others, ...merged, ...videosAdjusted];
      onMediaChange(nextMedia);
      persistAfterDelete({ media: nextMedia, folders });
    }
    exitMobileSelectMode();
    toast.success(`Removed ${items.length} file${items.length === 1 ? '' : 's'}`);
  };

  const navigateToFolder = (folderId: string) => {
    exitMobileSelectMode();
    const path = getFolderBreadcrumb(folderId, folders);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      path.slice(0, -1).forEach((f) => next.add(f.id));
      if (!folders.find((f) => f.id === folderId)?.parent_id) next.add(folderId);
      return next;
    });
    onSelectFolder(folderId);
  };

  const getItemsByKeys = (keys: Set<string>) => media.filter((m) => keys.has(mediaKey(m)));

  const selectRange = (ids: string[], anchorId: string | null, targetId: string) => {
    if (!anchorId) return new Set([targetId]);
    const start = ids.indexOf(anchorId);
    const end = ids.indexOf(targetId);
    if (start < 0 || end < 0) return new Set([targetId]);
    const [lo, hi] = start < end ? [start, end] : [end, start];
    return new Set(ids.slice(lo, hi + 1));
  };

  const selectFile = (item: ExplorerMediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = mediaKey(item);
    const listForItem = (item.folder_id ?? null) === null ? unassignedMedia : folderMedia;
    const fileKeys = listForItem.map(mediaKey);

    setSelectedFolderTileIds(new Set());

    if (isMobile) {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }
      if (!mobileFileSelectMode) {
        if (item.media_type === 'video') {
          const id = getYouTubeId(item.url);
          if (id) window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener,noreferrer');
          else toast.error('Invalid video URL');
        } else {
          setPreviewItem(item);
        }
        return;
      }
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      lastSelectedFileKey.current = key;
      return;
    }

    if (e.shiftKey && lastSelectedFileKey.current) {
      setSelectedKeys(selectRange(fileKeys, lastSelectedFileKey.current, key));
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } else {
      setSelectedKeys(new Set([key]));
    }
    lastSelectedFileKey.current = key;
  };

  const selectFolderTile = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKeys(new Set());

    if (isMobile && mobileFolderSelectMode) {
      setSelectedFolderTileIds((prev) => {
        const next = new Set(prev);
        if (next.has(folderId)) next.delete(folderId);
        else next.add(folderId);
        return next;
      });
      lastSelectedFolderTileId.current = folderId;
      return;
    }

    if (e.shiftKey && lastSelectedFolderTileId.current) {
      setSelectedFolderTileIds(selectRange(visibleFolderTileIds, lastSelectedFolderTileId.current, folderId));
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedFolderTileIds((prev) => {
        const next = new Set(prev);
        if (next.has(folderId)) next.delete(folderId);
        else next.add(folderId);
        return next;
      });
    } else {
      setSelectedFolderTileIds(new Set([folderId]));
    }
    lastSelectedFolderTileId.current = folderId;
  };

  const getPasteTargetFolderId = (): string | null => {
    if (selectedFolderTileIds.size === 1) return [...selectedFolderTileIds][0] ?? null;
    if (selectedFolderTileIds.size > 1) return null;
    if (!isAtRoot && selectedFolderId) return selectedFolderId;
    return null;
  };


  const handleCopy = () => {
    const items = getItemsByKeys(selectedKeys);
    if (!items.length) return;
    setClipboard({ mode: 'copy', items });
    toast.success(`Copied ${items.length} file${items.length === 1 ? '' : 's'}`);
  };

  const handleCut = () => {
    const items = getItemsByKeys(selectedKeys);
    if (!items.length) return;
    setClipboard({ mode: 'cut', items });
    toast.success(`Cut ${items.length} file${items.length === 1 ? '' : 's'}`);
  };

  const handlePaste = (targetFolderId: string | null = getPasteTargetFolderId()) => {
    if (!clipboard?.items.length) return;
    if (selectedFolderTileIds.size > 1) {
      toast.error('Select only one folder to paste into');
      return;
    }
    if (!targetFolderId) {
      toast.error('Select one folder to paste into');
      return;
    }
    if (targetFolderId === GALLERY_ROOT_ID) {
      toast.error('Open or select a folder to paste into');
      return;
    }
    if (clipboard.mode === 'cut') {
      const keys = new Set(clipboard.items.map(mediaKey));
      onMediaChange(moveMediaItems(media, keys, targetFolderId));
      setClipboard(null);
      setSelectedKeys(new Set());
      toast.success('Moved to folder');
    } else {
      onMediaChange(copyMediaItems(media, clipboard.items, targetFolderId));
      toast.success('Pasted');
    }
  };

  const handleDropOnFolder = (folderId: string | null) => {
    const keys = draggingKeys.size > 0 ? draggingKeys : selectedKeys;
    if (!keys.size) return;
    onMediaChange(moveMediaItems(media, keys, folderId));
    setDraggingKeys(new Set());
    clearSelection();
    if (clipboard?.mode === 'cut') setClipboard(null);
    toast.success('Moved to folder');
  };

  const uploadFilesToFolder = async (folderId: string | null, fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (!files.length) {
      toast.error('Drop image or video files only');
      return;
    }

    setExternalUploading(true);
    setUploadProgress(0);
    try {
      const target = resolveDropFolderId(folderId);
      const inFolder = media.filter((m) => (m.folder_id ?? null) === target);
      let nextOrder = inFolder.length > 0 ? Math.max(...inFolder.map((m) => m.display_order ?? 0)) + 1 : 0;
      const added: ExplorerMediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        setUploadBatch({ current: i + 1, total: files.length, name: file.name });

        const url = await uploadToCloudinary(file, uploadBucket as BucketName, (pct) => {
          const overall = Math.round(((i + pct / 100) / files.length) * 100);
          setUploadProgress(overall);
        });

        added.push({
          url,
          folder_id: target,
          display_order: nextOrder++,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          caption: null,
        });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const nextMedia = [...media, ...added];
      onMediaChange(nextMedia);
      toast.success(`Uploaded ${added.length} file${added.length === 1 ? '' : 's'}`);
      triggerAutosave({ media: nextMedia, folders });
    } catch (err) {
      toast.error('Upload failed', { description: (err as Error).message });
    } finally {
      setExternalUploading(false);
      setUploadProgress(0);
      setUploadBatch(null);
      setExternalDragOver(null);
      setDragOverFolderId(null);
    }
  };

  const handleFolderDrop = (folderId: string | null, files: FileList | null) => {
    if (files?.length) {
      void uploadFilesToFolder(folderId, files);
      return;
    }
    handleDropOnFolder(folderId);
    setDragOverFolderId(null);
    setExternalDragOver(null);
  };

  const startDrag = (item: ExplorerMediaItem) => {
    const key = mediaKey(item);
    const keys = selectedKeys.has(key) ? selectedKeys : new Set([key]);
    setDraggingKeys(keys);
    setSelectedKeys(keys);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFolderVisible = (id: string) => {
    onFoldersChange(folders.map((f) => (f.id === id ? { ...f, is_enabled: !f.is_enabled } : f)));
  };

  const goBack = () => {
    exitMobileSelectMode();
    if (selectedFolder?.parent_id) {
      onSelectFolder(selectedFolder.parent_id);
      return;
    }
    if (selectedFolder) {
      onSelectFolder(GALLERY_ROOT_ID);
    }
  };

  const openNewFolderDialog = (mode: 'category' | 'subfolder') => {
    setNewFolderMode(mode);
    setNewFolderName('');
    setNewFolderOpen(true);
  };

  const submitNewFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      toast.error('Enter a folder name');
      return;
    }
    if (newFolderMode === 'category') {
      await onCreateRootFolder(name);
    } else if (selectedFolder) {
      await onCreateSubfolder(selectedFolder.id, name);
      setExpandedIds((prev) => new Set(prev).add(selectedFolder.id));
    } else {
      toast.error('Open a folder first');
      return;
    }
    setNewFolderOpen(false);
    setNewFolderName('');
  };

  const setImagesForFolder = (urls: string[]) => {
    const folderId = selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId;
    const others = media.filter((m) => (m.folder_id ?? null) !== folderId);
    const existingInFolder = media.filter((m) => (m.folder_id ?? null) === folderId);
    const videosInFolder = existingInFolder.filter((m) => m.media_type === 'video');
    const merged = urls.map((url, i) => {
      const found = existingInFolder.find((e) => e.url === url && e.media_type === 'image');
      return found
        ? { ...found, display_order: i }
        : { url, folder_id: folderId, display_order: i, media_type: 'image' as const, caption: null };
    });
    const base = merged.length;
    const videosAdjusted = videosInFolder.map((v, i) => ({ ...v, folder_id: folderId, display_order: base + i }));
    const nextMedia = [...others, ...merged, ...videosAdjusted];
    const prevImageCount = existingInFolder.filter((m) => m.media_type === 'image').length;
    onMediaChange(nextMedia);
    if (urls.length < prevImageCount) {
      persistAfterDelete({ media: nextMedia, folders });
    } else {
      triggerAutosave({ media: nextMedia, folders });
    }
  };

  const addYoutubeVideo = () => {
    const raw = youtubeInput.trim();
    if (!raw) {
      toast.error('Enter a YouTube URL or video ID.');
      return;
    }
    const id = getYouTubeId(raw);
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      toast.error('Enter a valid YouTube URL or 11-character video ID.');
      return;
    }
    const folderId = selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId;
    const inFolder = media.filter((m) => (m.folder_id ?? null) === folderId);
    const nextOrder = inFolder.length > 0 ? Math.max(...inFolder.map((m) => m.display_order ?? 0)) + 1 : 0;
    onMediaChange([
      ...media,
      { url: id, folder_id: folderId, display_order: nextOrder, media_type: 'video', caption: youtubeTitle.trim() || null },
    ]);
    setYoutubeInput('');
    setYoutubeTitle('');
    setShowVideoForm(false);
    toast.success('Video added — save to publish.');
  };

  const removeVideo = (url: string, folderId: string | null = selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId) => {
    onMediaChange(media.filter((m) => !((m.folder_id ?? null) === folderId && m.media_type === 'video' && m.url === url)));
  };

  const folderGridLabel = isAtRoot ? 'Categories' : 'Folders';

  const renderMediaTiles = (items: ExplorerMediaItem[]) => (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((item) => {
        const key = mediaKey(item);
        const selected = selectedKeys.has(key);
        const tile = (
          <div
            data-explorer-item="file"
            draggable={!isMobile}
            onDragStart={isMobile ? undefined : () => startDrag(item)}
            onDragEnd={isMobile ? undefined : () => setDraggingKeys(new Set())}
            onClick={(e) => selectFile(item, e)}
            onPointerDown={handleFilePointerDown(item)}
            onPointerUp={cancelFileLongPress}
            onPointerCancel={cancelFileLongPress}
            onPointerLeave={cancelFileLongPress}
            onPointerMove={handleFilePointerMove}
            className={cn(
              'group relative aspect-square cursor-pointer overflow-hidden rounded-md border bg-muted transition-all touch-manipulation',
              selected ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 hover:border-primary/40',
              mobileFileSelectMode && !selected && 'opacity-90'
            )}
          >
            {item.media_type === 'video' ? (
              <>
                <img src={getYouTubeThumbnail(item.url)} alt="" className="h-full w-full object-contain bg-muted/20 p-1" draggable={false} />
                <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                  {item.caption || 'Video'}
                </div>
              </>
            ) : (
              <img
                src={optimizeMediaUrl(item.url, { preset: 'thumb' })}
                alt=""
                className="h-full w-full object-contain bg-muted/20 p-1"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            )}
            {selected ? (
              <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
                ✓
              </div>
            ) : null}
          </div>
        );
        return (
          <ContextMenu key={key}>
            <ContextMenuTrigger asChild>{tile}</ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => { setSelectedKeys(new Set([key])); handleCopy(); }}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { setSelectedKeys(new Set([key])); handleCut(); }}>
                <Scissors className="mr-2 h-4 w-4" /> Cut
              </ContextMenuItem>
              {clipboard?.items.length ? (
                <ContextMenuItem onClick={() => handlePaste()}>
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
                </ContextMenuItem>
              ) : null}
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (item.media_type === 'video') removeVideo(item.url, item.folder_id ?? null);
                  else if ((item.folder_id ?? null) === null) {
                    const nextMedia = media.filter((m) => mediaKey(m) !== key);
                    onMediaChange(nextMedia);
                    persistAfterDelete({ media: nextMedia, folders });
                  } else setImagesForFolder(imageUrls.filter((u) => u !== item.url));
                  setSelectedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );

  const handleContentDragOver = (e: React.DragEvent) => {
    if (!canUpload) return;
    e.preventDefault();
    if (isExternalFileDrag(e)) setExternalDragOver('content');
  };

  const handleContentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length && canUpload) {
      void uploadFilesToFolder(selectedFolderId, e.dataTransfer.files);
    }
    setExternalDragOver(null);
  };

  const pasteTargetId = getPasteTargetFolderId();
  const totalSelected = selectedKeys.size + selectedFolderTileIds.size;

  const renderToolbarActions = (mobile: boolean) => (
    <>
      {canCreateFolder ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('gap-1.5', mobile ? 'h-10 flex-1' : 'h-8')}
          disabled={creatingFolder || externalUploading}
          onClick={() => openNewFolderDialog(isAtRoot ? 'category' : 'subfolder')}
        >
          <FolderPlus className="h-3.5 w-3.5 shrink-0" />
          {mobile ? (isAtRoot ? 'Category' : 'Folder') : isAtRoot ? 'New category' : 'New folder'}
        </Button>
      ) : null}
      {canUpload ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('gap-1.5', mobile ? 'h-10 flex-1' : 'h-8')}
          disabled={externalUploading}
          onClick={() => {
            setShowUpload(true);
            setShowVideoForm(false);
          }}
        >
          <Upload className="h-3.5 w-3.5 shrink-0" />
          Upload
        </Button>
      ) : null}
      {!mobile && selectedKeys.size > 0 ? (
        <>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleCut}>
            <Scissors className="h-3.5 w-3.5" /> Cut
          </Button>
        </>
      ) : null}
      {!mobile && clipboard?.items.length && pasteTargetId ? (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handlePaste(pasteTargetId)}>
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste
        </Button>
      ) : null}
      {!mobile && selectedFolderTileIds.size === 1 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={renameSelectedFolderTile}
        >
          <Pencil className="h-3.5 w-3.5" /> Rename
        </Button>
      ) : null}
      {!mobile && canUpload ? (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowVideoForm((v) => !v)}>
          <Video className="h-3.5 w-3.5" />
          Add video
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-[hsl(var(--admin-surface-2))] shadow-sm md:min-h-[560px]">
      {/* Toolbar */}
      <div className="border-b border-border/60 bg-muted/25 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground md:h-8"
            disabled={isAtRoot}
            onClick={goBack}
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="md:inline">Back</span>
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <HardDrive className="mx-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <button
              type="button"
              className={cn('shrink-0 rounded px-1.5 py-0.5 hover:bg-muted/60', isAtRoot && 'font-medium text-foreground')}
              onClick={() => {
                clearSelection();
                onSelectFolder(GALLERY_ROOT_ID);
              }}
            >
              Gallery
            </button>
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.id} className="flex shrink-0 items-center gap-0.5">
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  className={cn(
                    'max-w-[7rem] truncate rounded px-1.5 py-0.5 hover:bg-muted/60 sm:max-w-[10rem]',
                    i === breadcrumb.length - 1 && 'font-medium text-foreground'
                  )}
                  onClick={() => navigateToFolder(crumb.id)}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Desktop toolbar actions */}
        <div className="mt-2 hidden flex-wrap items-center gap-1.5 md:flex">
          {renderToolbarActions(false)}
          {onSeedStandardFolders ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void onSeedStandardFolders()}>Import standard categories…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* Mobile toolbar — primary actions + overflow menu */}
        <div className="mt-2 flex items-center gap-2 md:hidden">
          {renderToolbarActions(true)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {selectedKeys.size > 0 ? (
                <>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copy selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCut}>
                    <Scissors className="mr-2 h-4 w-4" /> Cut selected
                  </DropdownMenuItem>
                </>
              ) : null}
              {clipboard?.items.length && pasteTargetId ? (
                <DropdownMenuItem onClick={() => handlePaste(pasteTargetId)}>
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
                </DropdownMenuItem>
              ) : null}
              {canUpload ? (
                <DropdownMenuItem
                  onClick={() => {
                    setShowVideoForm((v) => !v);
                    setShowUpload(false);
                  }}
                >
                  <Video className="mr-2 h-4 w-4" /> Add video
                </DropdownMenuItem>
              ) : null}
              {onSeedStandardFolders ? (
                <DropdownMenuItem onClick={() => void onSeedStandardFolders()}>Import standard categories…</DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Navigation pane — tree collapsed by default; expand as you navigate */}
        <aside className="hidden w-full shrink-0 flex-col border-b border-border/60 bg-muted/15 md:flex lg:w-[220px] lg:border-b-0 lg:border-r xl:w-[240px]">
          <div className="border-b border-border/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Navigation</p>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-2 lg:max-h-none lg:flex-1">
            <button
              type="button"
              className={cn(
                'mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                isAtRoot ? 'bg-primary/12 text-primary' : 'hover:bg-muted/70'
              )}
              onClick={() => {
              clearSelection();
              onSelectFolder(GALLERY_ROOT_ID);
            }}
            >
              <HardDrive className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">All categories</span>
            </button>
            {tree.map((node) => (
              <NavTreeRow
                key={node.folder.id}
                node={node}
                depth={0}
                selectedId={selectedFolderId}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onSelect={navigateToFolder}
                mediaCounts={mediaCounts}
              />
            ))}
          </div>
        </aside>

        {/* Content pane */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-background">
          {(externalUploading || externalDragOver) && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 z-20 flex items-center justify-center',
                externalDragOver ? 'bg-primary/10' : 'bg-background/60'
              )}
            >
              <div className="flex min-w-[260px] max-w-sm flex-col gap-3 rounded-lg border-2 border-dashed border-primary bg-background/95 px-6 py-4 shadow-lg">
                {externalUploading ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                      <span className="text-sm font-medium">
                        Uploading
                        {uploadBatch && uploadBatch.total > 1
                          ? ` ${uploadBatch.current} of ${uploadBatch.total}`
                          : ''}
                        … {uploadProgress}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    {uploadBatch?.name ? (
                      <p className="truncate text-xs text-muted-foreground">{uploadBatch.name}</p>
                    ) : null}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Drop files to upload here</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedFolder ? (
            <div className="flex flex-col gap-2 border-b border-border/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="truncate font-medium">{selectedFolder.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {selectedFolder.parent_id ? 'Folder' : 'Category'} · {folderDescendantCounts.get(selectedFolder.id) ?? folderMedia.length} items
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-muted-foreground">Public</span>
                <Switch checked={selectedFolder.is_enabled} onCheckedChange={() => toggleFolderVisible(selectedFolder.id)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 md:h-8 md:w-8"
                  onClick={() => openRenameFolderDialog(selectedFolder.id)}
                  aria-label="Rename folder"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:text-destructive md:h-8 md:w-8"
                  onClick={() => void onDeleteFolder(selectedFolder.id)}
                  aria-label="Delete folder"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}

          {isMobile && (mobileFileSelectMode || mobileFolderSelectMode) ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-primary/25 bg-primary/8 px-3 py-2 md:hidden">
              <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 px-2" onClick={exitMobileSelectMode}>
                Cancel
              </Button>
              <span className="min-w-[5rem] flex-1 text-sm font-medium tabular-nums">
                {totalSelected} selected
              </span>
              {mobileFileSelectMode ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 px-2.5"
                    disabled={selectedKeys.size === 0}
                    onClick={handleCopy}
                  >
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 px-2.5"
                    disabled={selectedKeys.size === 0}
                    onClick={handleCut}
                  >
                    Cut
                  </Button>
                  {clipboard?.items.length && pasteTargetId ? (
                    <Button type="button" size="sm" variant="outline" className="h-9 px-2.5" onClick={() => handlePaste(pasteTargetId)}>
                      Paste
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-9 px-2.5"
                    disabled={selectedKeys.size === 0}
                    onClick={deleteSelectedFiles}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  {clipboard?.items.length && pasteTargetId ? (
                    <Button type="button" size="sm" variant="outline" className="h-9 px-2.5" onClick={() => handlePaste(pasteTargetId)}>
                      Paste
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 px-2.5"
                    disabled={selectedFolderTileIds.size !== 1}
                    onClick={renameSelectedFolderTile}
                  >
                    Rename
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-9 px-2.5"
                    disabled={selectedFolderTileIds.size !== 1}
                    onClick={deleteSelectedFolderTile}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          ) : null}

          <div
            className="relative flex-1 overflow-y-auto p-4"
            onDragOver={handleContentDragOver}
            onDragLeave={() => setExternalDragOver(null)}
            onDrop={handleContentDrop}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[data-explorer-item]')) return;
              if (isMobile && (mobileFileSelectMode || mobileFolderSelectMode)) return;
              clearSelection();
            }}
          >
            {/* Folder grid — root shows categories; inside any folder shows child folders */}
            {(isAtRoot || selectedFolder) && childFolders.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {folderGridLabel}
                  {selectedFolderTileIds.size > 0 ? ` · ${selectedFolderTileIds.size} selected` : ''}
                </p>
                <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                  {childFolders.map((f) => {
                    const count = folderDescendantCounts.get(f.id) ?? mediaCounts.get(f.id) ?? 0;
                    const isTarget = dragOverFolderId === f.id || externalDragOver === f.id;
                    return (
                      <FolderTile
                        key={f.id}
                        folderId={f.id}
                        name={f.name}
                        count={count}
                        selected={selectedFolderTileIds.has(f.id)}
                        hidden={!f.is_enabled}
                        isDropTarget={isTarget}
                        hasClipboard={!!clipboard?.items.length}
                        canDelete
                        onSelect={(e) => selectFolderTile(f.id, e)}
                        onOpen={() => navigateToFolder(f.id)}
                        onPaste={() => handlePaste(f.id)}
                        onRename={() => openRenameFolderDialog(f.id)}
                        onDelete={() => void onDeleteFolder(f.id)}
                        onDragOverFolder={(id, external) => {
                          if (external) setExternalDragOver(id);
                          else setDragOverFolderId(id);
                        }}
                        onDragLeaveFolder={() => {
                          setDragOverFolderId(null);
                          setExternalDragOver(null);
                        }}
                        onDropOnFolder={handleFolderDrop}
                        isMobile={isMobile}
                        folderSelectionMode={mobileFolderSelectMode}
                        suppressClickRef={suppressNextClickRef}
                        onFolderLongPress={() => enterFolderSelectMode(f.id)}
                      />
                    );
                  })}
                </div>
                <p className="mt-2 hidden text-[11px] text-muted-foreground md:block">
                  Click to select · Ctrl+click multi-select · Shift+click range · Double-click to open · Right-click for menu
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground md:hidden">
                  {mobileFolderSelectMode
                    ? 'Tap folders to select · Rename or delete one at a time'
                    : isAtRoot
                      ? 'Tap to open a category · Long-press to select folders'
                      : 'Long-press a photo to select · Then tap more photos'}
                </p>
              </div>
            )}

            {isAtRoot && unassignedMedia.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Not in any folder · {unassignedMedia.length}
                    {selectedKeys.size > 0 && unassignedMedia.some((m) => selectedKeys.has(mediaKey(m)))
                      ? ` · ${[...selectedKeys].filter((k) => unassignedMedia.some((m) => mediaKey(m) === k)).length} selected`
                      : ''}
                  </p>
                  <Button type="button" size="sm" variant="destructive" className="h-9" onClick={deleteAllUnassigned}>
                    Delete all
                  </Button>
                </div>
                {isMobile && !mobileFileSelectMode ? (
                  <p className="mb-2 text-[11px] text-muted-foreground md:hidden">
                    Tap to preview · Long-press to select · Move into a category with Cut/Copy + Paste
                  </p>
                ) : null}
                {renderMediaTiles(unassignedMedia)}
              </div>
            )}

            {isAtRoot && childFolders.length === 0 && unassignedMedia.length === 0 && (
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 py-16 text-center"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (isExternalFileDrag(e)) setExternalDragOver('root');
                }}
                onDragLeave={() => setExternalDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  toast.info('Create a category folder first, then drop files inside it.');
                  setExternalDragOver(null);
                }}
              >
                <Folder className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No categories yet</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Categories appear here immediately. Open one to add subfolders and drop photos from your computer.
                </p>
                <Button type="button" className="mt-4 gap-1.5" size="sm" onClick={() => openNewFolderDialog('category')}>
                  <FolderPlus className="h-4 w-4" />
                  New category
                </Button>
              </div>
            )}

            {selectedFolder && childFolders.length === 0 && folderMedia.length === 0 && !showUpload && (
              <div className="mb-4 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center">
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">This folder is empty</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Drag photos from your computer here, or create a subfolder and upload inside it.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openNewFolderDialog('subfolder')}>
                    <FolderPlus className="mr-1.5 h-4 w-4" />
                    New folder
                  </Button>
                  <Button type="button" size="sm" onClick={() => setShowUpload(true)}>
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload photos
                  </Button>
                </div>
              </div>
            )}

            {canUpload && showUpload && (
              <div className="mb-6 rounded-lg border border-border/60 bg-muted/10 p-4">
                <Label className="mb-2 block text-sm font-medium">Upload photos</Label>
                <ImageUpload
                  value={imageUrls}
                  onChange={(v) => setImagesForFolder((v as string[]) || [])}
                  multiple
                  maxFiles={40}
                  previewFit="contain"
                  bucket={uploadBucket as BucketName}
                  enableBulkDelete
                  uploadOnSelect
                />
              </div>
            )}

            {canUpload && showVideoForm && (
              <div className="mb-6 space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
                <Label className="text-sm font-medium">Add YouTube video</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input value={youtubeInput} onChange={(e) => setYoutubeInput(e.target.value)} placeholder="YouTube URL or video ID" />
                  <Input value={youtubeTitle} onChange={(e) => setYoutubeTitle(e.target.value)} placeholder="Title (optional)" />
                </div>
                <Button type="button" size="sm" onClick={addYoutubeVideo}>
                  Add to folder
                </Button>
              </div>
            )}

            {canUpload && (imageUrls.length > 0 || videos.length > 0) && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Files in this folder {selectedKeys.size > 0 ? `· ${selectedKeys.size} selected` : ''}
                </p>
                {isMobile && !mobileFileSelectMode ? (
                  <p className="mb-2 text-[11px] text-muted-foreground md:hidden">
                    Tap a photo to preview · Long-press to select multiple
                  </p>
                ) : null}
                {renderMediaTiles(folderMedia)}
              </div>
            )}
          </div>

          <div className="border-t border-border/50 bg-muted/15 px-4 py-1.5 text-[11px] text-muted-foreground">
            {folders.filter((f) => !f.parent_id).length} categories · {folders.filter((f) => f.parent_id).length} subfolders ·{' '}
            {media.length} files
            {totalSelected > 0 ? ` · ${totalSelected} selected` : ''}
            {externalUploading ? ` · Uploading ${uploadProgress}%` : ''}
            {contentTargetId !== GALLERY_ROOT_ID && selectedFolder && !selectedFolder.is_enabled ? ' · Hidden from website' : ''}
          </div>
        </main>
      </div>

      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className={cn('max-w-4xl gap-0 overflow-hidden border-0 p-0 sm:max-w-4xl', adminDialogMobileClass)}>
          {previewItem?.media_type !== 'video' ? (
            <img
              src={previewItem?.url ? optimizeMediaUrl(previewItem.url, { preset: 'lightbox' }) : ''}
              alt=""
              className="max-h-[85dvh] w-full object-contain bg-black/95"
              loading="eager"
              decoding="async"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className={cn('max-w-md', adminDialogMobileClass)}>
          <DialogHeader>
            <DialogTitle>{newFolderMode === 'category' ? 'New category folder' : 'New folder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="folder-name">{newFolderMode === 'category' ? 'Category name' : 'Folder name'}</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={newFolderMode === 'category' ? 'e.g. Wedding' : 'e.g. Haldi'}
              onKeyDown={(e) => e.key === 'Enter' && void submitNewFolder()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {newFolderMode === 'category'
                ? 'Top-level folder shown on the public gallery.'
                : `Inside “${selectedFolder?.name ?? 'folder'}”. You can nest more folders or drop photos here.`}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={creatingFolder} onClick={() => void submitNewFolder()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameFolderOpen}
        onOpenChange={(open) => {
          setRenameFolderOpen(open);
          if (!open) {
            setRenameFolderId(null);
            setRenameFolderName('');
          }
        }}
      >
        <DialogContent className={cn('max-w-md', adminDialogMobileClass)}>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rename-folder-name">Folder name</Label>
            <Input
              id="rename-folder-name"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter a new name"
              onKeyDown={(e) => e.key === 'Enter' && void submitRenameFolder()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Updates the label on the public gallery and in admin navigation.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRenameFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={renamingFolder} onClick={() => void submitRenameFolder()}>
              {renamingFolder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
