import { useRef, useState } from 'react';
import { ClipboardPaste, Copy, Loader2, Scissors, Trash2, Upload } from 'lucide-react';
import { optimizeMediaUrl } from '@/lib/mediaDelivery';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AdminSortableGrid, AdminSortableItem } from '@/components/admin/AdminSortableGrid';

export type AlbumPhotoItem = {
  id?: string;
  url: string;
  display_order: number;
};

type ClipboardState = {
  mode: 'copy' | 'cut';
  items: AlbumPhotoItem[];
} | null;

type AdminAlbumPhotoGridProps = {
  photos: AlbumPhotoItem[];
  onChange: (photos: AlbumPhotoItem[]) => void;
  autosaveEnabled?: boolean;
  onPersist?: (photos: AlbumPhotoItem[]) => void | Promise<void>;
  maxFiles?: number;
};

function photoKey(photo: AlbumPhotoItem): string {
  return photo.id ?? photo.url;
}

function normalizeOrder(items: AlbumPhotoItem[]): AlbumPhotoItem[] {
  return items.map((item, i) => ({ ...item, display_order: i }));
}

export default function AdminAlbumPhotoGrid({
  photos,
  onChange,
  autosaveEnabled = true,
  onPersist,
  maxFiles = 200,
}: AdminAlbumPhotoGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<ClipboardState>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
  const sortedKeys = sorted.map(photoKey);

  const commit = (next: AlbumPhotoItem[], opts?: { persist?: boolean }) => {
    const ordered = normalizeOrder(next);
    onChange(ordered);
    if ((opts?.persist ?? autosaveEnabled) && onPersist) {
      void Promise.resolve(onPersist(ordered));
    }
  };

  const getSelected = () => sorted.filter((p) => selectedKeys.has(photoKey(p)));

  const handleUploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      toast.error('Select image files only');
      return;
    }
    const remaining = maxFiles - sorted.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxFiles} photos per album`);
      return;
    }
    const batch = list.slice(0, remaining);
    setUploading(true);
    setUploadProgress(0);
    try {
      const urls: string[] = [];
      for (let i = 0; i < batch.length; i++) {
        const url = await uploadToCloudinary(batch[i]!, 'album-images', (pct) => {
          setUploadProgress(Math.round(((i + pct / 100) / batch.length) * 100));
        });
        urls.push(url);
      }
      const added: AlbumPhotoItem[] = urls.map((url, i) => ({
        url,
        display_order: sorted.length + i,
      }));
      commit([...sorted, ...added]);
      toast.success(`Uploaded ${urls.length} photo${urls.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error('Upload failed', { description: (err as Error).message });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCopy = () => {
    const items = getSelected();
    if (!items.length) {
      toast.error('Select photos to copy');
      return;
    }
    setClipboard({ mode: 'copy', items });
    toast.success(`Copied ${items.length} photo${items.length === 1 ? '' : 's'}`);
  };

  const handleCut = () => {
    const items = getSelected();
    if (!items.length) {
      toast.error('Select photos to cut');
      return;
    }
    setClipboard({ mode: 'cut', items });
    toast.success(`Cut ${items.length} photo${items.length === 1 ? '' : 's'}`);
  };

  const handlePaste = () => {
    if (!clipboard?.items.length) return;
    const keys = new Set(clipboard.items.map(photoKey));
    let base = sorted;
    if (clipboard.mode === 'cut') {
      base = sorted.filter((p) => !keys.has(photoKey(p)));
      setClipboard(null);
      setSelectedKeys(new Set());
    }
    const additions: AlbumPhotoItem[] = clipboard.items.map((item) =>
      clipboard.mode === 'cut' && item.id
        ? { id: item.id, url: item.url, display_order: 0 }
        : { url: item.url, display_order: 0 }
    );
    commit([...base, ...additions]);
    toast.success('Pasted');
  };

  const handleDelete = () => {
    const items = getSelected();
    if (!items.length) {
      toast.error('Select photos to delete');
      return;
    }
    if (!confirm(`Delete ${items.length} photo${items.length === 1 ? '' : 's'}?`)) return;
    const keys = new Set(items.map(photoKey));
    commit(
      sorted.filter((p) => !keys.has(photoKey(p))),
      { persist: true }
    );
    setSelectedKeys(new Set());
    toast.success('Deleted');
  };

  const toggleSelect = (photo: AlbumPhotoItem, e: React.MouseEvent) => {
    const key = photoKey(photo);
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    setSelectedKeys(new Set([key]));
  };

  const handleReorder = (orderedIds: string[]) => {
    const byKey = new Map(sorted.map((p) => [photoKey(p), p]));
    const next = orderedIds.map((id) => byKey.get(id)).filter((p): p is AlbumPhotoItem => !!p);
    commit(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleUploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-1.5"
          disabled={uploading || sorted.length >= maxFiles}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload photos
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCopy} disabled={!selectedKeys.size}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCut} disabled={!selectedKeys.size}>
          <Scissors className="h-3.5 w-3.5" /> Cut
        </Button>
        {clipboard?.items.length ? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handlePaste}>
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={!selectedKeys.size}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
        <span className="text-xs text-muted-foreground">
          {sorted.length} / {maxFiles} · Drag grip to reorder
        </span>
      </div>

      {uploading ? (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-12 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.length) void handleUploadFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium">No photos yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Click Upload photos or drop images here</p>
        </div>
      ) : (
        <AdminSortableGrid
          itemIds={sortedKeys}
          onReorder={handleReorder}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {sorted.map((photo) => {
            const key = photoKey(photo);
            const selected = selectedKeys.has(key);
            return (
              <AdminSortableItem key={key} id={key} handleTone="dark">
                <button
                  type="button"
                  onClick={(e) => toggleSelect(photo, e)}
                  className={cn(
                    'relative aspect-square w-full overflow-hidden rounded-lg border bg-muted transition-all',
                    selected ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 hover:border-primary/40'
                  )}
                >
                  <img
                    src={optimizeMediaUrl(photo.url, { preset: 'thumb' })}
                    alt=""
                    className="h-full w-full object-contain p-1"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  {selected ? (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      ✓
                    </span>
                  ) : null}
                </button>
              </AdminSortableItem>
            );
          })}
        </AdminSortableGrid>
      )}

      <p className="text-[11px] text-muted-foreground">
        Click a photo to select · Ctrl/Cmd+click for multi-select · Use Copy, Cut, Paste, Delete from the toolbar above
      </p>
    </div>
  );
}
