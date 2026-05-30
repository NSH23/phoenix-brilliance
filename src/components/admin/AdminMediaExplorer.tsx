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
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Scissors,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
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
  onDeleteFolder: (folderId: string) => Promise<void>;
  onSeedStandardFolders?: () => Promise<void>;
  creatingFolder?: boolean;
};

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
  onDelete,
  canDelete,
  hasClipboard,
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
  onDelete?: () => void;
  canDelete?: boolean;
  hasClipboard?: boolean;
}) {
  const tile = (
    <div
      data-explorer-item="folder"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpen();
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
  onDeleteFolder,
  onSeedStandardFolders,
  creatingFolder = false,
}: AdminMediaExplorerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderMode, setNewFolderMode] = useState<'category' | 'subfolder'>('category');
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
  const isUncategorized = selectedFolderId === UNCategorized_FOLDER_ID;

  const selectedFolder =
    selectedFolderId && selectedFolderId !== UNCategorized_FOLDER_ID && selectedFolderId !== GALLERY_ROOT_ID
      ? folders.find((f) => f.id === selectedFolderId)
      : null;

  const breadcrumb = useMemo(() => {
    if (isAtRoot || isUncategorized) return [];
    return getFolderBreadcrumb(selectedFolderId, folders);
  }, [isAtRoot, isUncategorized, selectedFolderId, folders]);

  const childFolders = useMemo(() => {
    if (isAtRoot) return folders.filter((f) => !f.parent_id).sort((a, b) => a.display_order - b.display_order);
    if (selectedFolder) return folders.filter((f) => f.parent_id === selectedFolder.id).sort((a, b) => a.display_order - b.display_order);
    return [];
  }, [isAtRoot, selectedFolder, folders]);

  const folderMedia = useMemo(() => {
    if (isAtRoot) return [] as ExplorerMediaItem[];
    return getMediaInFolder(selectedFolderId, media);
  }, [isAtRoot, selectedFolderId, media]);

  const imageUrls = folderMedia.filter((m) => m.media_type !== 'video').map((m) => m.url);
  const videos = folderMedia.filter((m) => m.media_type === 'video');

  const canCreateFolder = isAtRoot || (!!selectedFolder && !isUncategorized);
  const canUpload = !isAtRoot;
  const contentTargetId = isAtRoot ? GALLERY_ROOT_ID : selectedFolderId;

  const visibleFolderTileIds = useMemo(() => {
    const ids = childFolders.map((f) => f.id);
    if (isAtRoot && (mediaCounts.get(UNCategorized_FOLDER_ID) ?? 0) > 0) {
      ids.push(UNCategorized_FOLDER_ID);
    }
    return ids;
  }, [childFolders, isAtRoot, mediaCounts]);

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

  const navigateToFolder = (folderId: string) => {
    clearSelection();
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
    const fileKeys = folderMedia.map(mediaKey);

    setSelectedFolderTileIds(new Set());

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
    if (isUncategorized) return UNCategorized_FOLDER_ID;
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

      onMediaChange([...media, ...added]);
      toast.success(`Uploaded ${added.length} file${added.length === 1 ? '' : 's'}`);
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
    clearSelection();
    if (isUncategorized) {
      onSelectFolder(GALLERY_ROOT_ID);
      return;
    }
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
    const folderId = isUncategorized ? null : selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId;
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
    onMediaChange([...others, ...merged, ...videosAdjusted]);
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
    const folderId = isUncategorized ? null : selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId;
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

  const removeVideo = (url: string) => {
    const folderId = isUncategorized ? null : selectedFolderId === GALLERY_ROOT_ID ? null : selectedFolderId;
    onMediaChange(media.filter((m) => !((m.folder_id ?? null) === folderId && m.media_type === 'video' && m.url === url)));
  };

  const folderGridLabel = isAtRoot ? 'Categories' : 'Folders';

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

  return (
    <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-border/70 bg-[hsl(var(--admin-surface-2))] shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/25 px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          disabled={isAtRoot}
          onClick={goBack}
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm">
          <HardDrive className="mx-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
            <span key={crumb.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              <button
                type="button"
                className={cn(
                  'truncate rounded px-1.5 py-0.5 hover:bg-muted/60',
                  i === breadcrumb.length - 1 && 'font-medium text-foreground'
                )}
                onClick={() => navigateToFolder(crumb.id)}
              >
                {crumb.name}
              </button>
            </span>
          ))}
          {isUncategorized ? (
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">Uncategorized</span>
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {canCreateFolder ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              disabled={creatingFolder || externalUploading}
              onClick={() => openNewFolderDialog(isAtRoot ? 'category' : 'subfolder')}
            >
              <FolderPlus className="h-3.5 w-3.5" />
              {isAtRoot ? 'New category' : 'New folder'}
            </Button>
          ) : null}
          {selectedKeys.size > 0 ? (
            <>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleCut}>
                <Scissors className="h-3.5 w-3.5" /> Cut
              </Button>
            </>
          ) : null}
          {clipboard?.items.length && pasteTargetId ? (
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handlePaste(pasteTargetId)}>
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </Button>
          ) : null}
          {canUpload ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={externalUploading}
                onClick={() => setShowUpload((v) => !v)}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowVideoForm((v) => !v)}>
                <Video className="h-3.5 w-3.5" />
                Add video
              </Button>
            </>
          ) : null}
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
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Navigation pane — tree collapsed by default; expand as you navigate */}
        <aside className="flex w-full shrink-0 flex-col border-b border-border/60 bg-muted/15 lg:w-[220px] lg:border-b-0 lg:border-r xl:w-[240px]">
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
            <button
              type="button"
              className={cn(
                'mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                isUncategorized ? 'bg-primary/12 text-primary' : 'hover:bg-muted/70'
              )}
              onClick={() => {
                clearSelection();
                onSelectFolder(UNCategorized_FOLDER_ID);
              }}
            >
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">Uncategorized</span>
              {(mediaCounts.get(UNCategorized_FOLDER_ID) ?? 0) > 0 ? (
                <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                  {mediaCounts.get(UNCategorized_FOLDER_ID)}
                </span>
              ) : null}
            </button>
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
            <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{selectedFolder.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedFolder.parent_id ? 'Folder' : 'Category'} · {folderDescendantCounts.get(selectedFolder.id) ?? folderMedia.length} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Public</span>
                <Switch checked={selectedFolder.is_enabled} onCheckedChange={() => toggleFolderVisible(selectedFolder.id)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  onClick={() => void onDeleteFolder(selectedFolder.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
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
                      />
                    );
                  })}
                  {isAtRoot && (mediaCounts.get(UNCategorized_FOLDER_ID) ?? 0) > 0 ? (
                    <FolderTile
                      folderId={UNCategorized_FOLDER_ID}
                      name="Uncategorized"
                      count={mediaCounts.get(UNCategorized_FOLDER_ID) ?? 0}
                      selected={selectedFolderTileIds.has(UNCategorized_FOLDER_ID)}
                      isDropTarget={dragOverFolderId === UNCategorized_FOLDER_ID || externalDragOver === UNCategorized_FOLDER_ID}
                      hasClipboard={!!clipboard?.items.length}
                      onSelect={(e) => selectFolderTile(UNCategorized_FOLDER_ID, e)}
                      onOpen={() => {
                        clearSelection();
                        onSelectFolder(UNCategorized_FOLDER_ID);
                      }}
                      onPaste={() => handlePaste(UNCategorized_FOLDER_ID)}
                      onDragOverFolder={(id, external) => {
                        if (external) setExternalDragOver(id);
                        else setDragOverFolderId(id);
                      }}
                      onDragLeaveFolder={() => {
                        setDragOverFolderId(null);
                        setExternalDragOver(null);
                      }}
                      onDropOnFolder={handleFolderDrop}
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Click to select · Ctrl+click multi-select · Shift+click range · Double-click to open · Right-click for menu
                </p>
              </div>
            )}

            {isAtRoot && childFolders.length === 0 && (mediaCounts.get(UNCategorized_FOLDER_ID) ?? 0) === 0 && (
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
                  previewClassName="object-cover"
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
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {folderMedia.map((item) => {
                    const key = mediaKey(item);
                    const selected = selectedKeys.has(key);
                    const tile = (
                      <div
                        data-explorer-item="file"
                        draggable
                        onDragStart={() => startDrag(item)}
                        onDragEnd={() => setDraggingKeys(new Set())}
                        onClick={(e) => selectFile(item, e)}
                        className={cn(
                          'group relative aspect-square cursor-pointer overflow-hidden rounded-md border bg-muted transition-all',
                          selected ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 hover:border-primary/40'
                        )}
                      >
                        {item.media_type === 'video' ? (
                          <>
                            <img src={getYouTubeThumbnail(item.url)} alt="" className="h-full w-full object-cover" draggable={false} />
                            <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                              {item.caption || 'Video'}
                            </div>
                          </>
                        ) : (
                          <img src={item.url} alt="" className="h-full w-full object-cover" draggable={false} />
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
                              if (item.media_type === 'video') removeVideo(item.url);
                              else setImagesForFolder(imageUrls.filter((u) => u !== item.url));
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

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-md">
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
    </div>
  );
}
