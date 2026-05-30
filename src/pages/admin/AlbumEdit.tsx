import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Star } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import AdminMediaExplorer from '@/components/admin/AdminMediaExplorer';
import ImageUpload from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { adminPanelClass } from '@/components/admin/adminStyles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Album,
  AlbumFolder,
  AlbumMedia,
  createAlbum,
  createAlbumFolder,
  createAlbumMedia,
  deleteAlbum,
  deleteAlbumFolder,
  deleteAlbumMedia,
  getAlbumMedia,
  getAlbumWithMedia,
  updateAlbum,
  updateAlbumFolder,
  updateAlbumMedia,
} from '@/services/albums';
import { getAllEvents, Event } from '@/services/events';
import { GALLERY_ROOT_ID, type ExplorerFolder, type ExplorerMediaItem } from '@/lib/mediaFolderTree';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

type GalleryMediaRow = ExplorerMediaItem & { id?: string };

function mapFolders(folders: AlbumFolder[]): ExplorerFolder[] {
  return folders.map((f) => ({
    id: f.id,
    parent_id: f.parent_id,
    name: f.name,
    display_order: f.display_order,
    is_enabled: f.is_enabled ?? true,
    cover_image_url: f.cover_image_url ?? null,
  }));
}

function mapMedia(items: AlbumMedia[]): GalleryMediaRow[] {
  return items.map((m, i) => ({
    id: m.id,
    url: m.type === 'video' ? (m.youtube_url || m.url || '') : (m.url || ''),
    folder_id: m.folder_id ?? null,
    display_order: m.display_order ?? i,
    media_type: m.type === 'video' ? 'video' : 'image',
    caption: m.caption ?? null,
  }));
}

export default function AlbumEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventId: '',
    coverImage: '',
    eventDate: '',
    isFeatured: false,
    isActive: true,
  });
  const [galleryFolders, setGalleryFolders] = useState<ExplorerFolder[]>([]);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaRow[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(GALLERY_ROOT_ID);

  useEffect(() => {
    void getAllEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  const loadAlbum = useCallback(
    async (albumId: string) => {
      setLoading(true);
      try {
        const full = await getAlbumWithMedia(albumId);
        setEditingAlbum(full);
        setFormData({
          title: full.title,
          description: full.description || '',
          eventId: full.event_id,
          coverImage: full.cover_image || '',
          eventDate: full.event_date ? full.event_date.slice(0, 10) : '',
          isFeatured: full.is_featured ?? false,
          isActive: full.is_active ?? true,
        });
        const folders = (full as { album_folders?: AlbumFolder[] }).album_folders || [];
        const media = full.album_media || [];
        setGalleryMedia(mapMedia(media));
        setGalleryFolders(mapFolders(folders));
        setSelectedFolderId(GALLERY_ROOT_ID);
      } catch (err) {
        logger.error('Failed to load album', err, { component: 'AlbumEditPage' });
        toast.error('Failed to load album');
        navigate('/admin/albums');
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (isNew) {
      setSelectedFolderId(GALLERY_ROOT_ID);
      return;
    }
    if (id) void loadAlbum(id);
  }, [id, isNew, loadAlbum]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Album title is required');
      return;
    }
    if (!formData.eventId) {
      toast.error('Select an event');
      return;
    }
    setSaving(true);
    try {
      const base = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_id: formData.eventId,
        cover_image: formData.coverImage.trim() || null,
        event_date: formData.eventDate || null,
        is_featured: formData.isFeatured,
        is_active: formData.isActive,
      };

      if (isNew) {
        const created = await createAlbum(base);
        toast.success('Album created');
        navigate(`/admin/albums/${created.id}/edit`, { replace: true });
        return;
      }

      if (!editingAlbum) return;
      await updateAlbum(editingAlbum.id, base);
      const albumId = editingAlbum.id;

      for (const folder of galleryFolders) {
        await updateAlbumFolder(folder.id, {
          name: folder.name,
          display_order: folder.display_order,
          is_enabled: folder.is_enabled,
          cover_image_url: folder.cover_image_url ?? null,
        });
      }

      const validFolderIds = new Set(galleryFolders.map((f) => f.id));
      const resolveFolderId = (fid: string | null): string | null => {
        if (!fid) return null;
        return validFolderIds.has(fid) ? fid : null;
      };

      const existingMedia = await getAlbumMedia(albumId);
      const existingIds = new Set(existingMedia.map((m) => m.id));
      const currentIds = new Set(galleryMedia.filter((m) => m.id).map((m) => m.id!));

      for (const item of galleryMedia) {
        const folderId = resolveFolderId(item.folder_id);
        const isVideo = item.media_type === 'video';
        if (item.id && existingIds.has(item.id)) {
          const existing = existingMedia.find((e) => e.id === item.id);
          const updates: Parameters<typeof updateAlbumMedia>[1] = {};
          if (existing?.folder_id !== folderId) updates.folder_id = folderId;
          if (isVideo) {
            if (existing?.youtube_url !== item.url) updates.youtube_url = item.url;
          } else if (existing?.url !== item.url) {
            updates.url = item.url;
          }
          if (existing && (existing.caption ?? '') !== (item.caption ?? '')) {
            updates.caption = item.caption ?? null;
          }
          if (Object.keys(updates).length > 0) {
            await updateAlbumMedia(item.id, updates);
          }
        } else if (!item.id) {
          await createAlbumMedia({
            album_id: albumId,
            type: isVideo ? 'video' : 'image',
            url: isVideo ? null : item.url,
            youtube_url: isVideo ? item.url : null,
            caption: item.caption ?? null,
            is_featured: false,
            display_order: item.display_order,
            folder_id: folderId,
          });
        }
      }
      for (const e of existingMedia) {
        if (!currentIds.has(e.id)) await deleteAlbumMedia(e.id);
      }

      toast.success('Album saved');
      void loadAlbum(albumId);
    } catch (err: unknown) {
      toast.error('Save failed', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAlbum || !confirm('Delete this album permanently?')) return;
    try {
      await deleteAlbum(editingAlbum.id);
      toast.success('Album deleted');
      navigate('/admin/albums');
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    }
  };

  const handleCreateRootFolder = async (name: string) => {
    if (!editingAlbum) return;
    setCreatingFolder(true);
    try {
      const root = galleryFolders.filter((f) => !f.parent_id);
      const nextOrder = root.length > 0 ? Math.max(...root.map((f) => f.display_order ?? 0)) + 1 : 0;
      const created = await createAlbumFolder({
        album_id: editingAlbum.id,
        parent_id: null,
        name,
        display_order: nextOrder,
        is_enabled: true,
      });
      setGalleryFolders((prev) => [...prev, mapFolders([created])[0]!]);
      setSelectedFolderId(created.id);
      toast.success('Folder created');
    } catch (err) {
      toast.error('Failed to create folder', { description: (err as Error).message });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleCreateSubfolder = async (parentId: string, name: string) => {
    if (!editingAlbum) return;
    setCreatingFolder(true);
    try {
      const siblings = galleryFolders.filter((f) => f.parent_id === parentId);
      const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((f) => f.display_order ?? 0)) + 1 : 0;
      const created = await createAlbumFolder({
        album_id: editingAlbum.id,
        parent_id: parentId,
        name,
        display_order: nextOrder,
        is_enabled: true,
      });
      setGalleryFolders((prev) => [...prev, mapFolders([created])[0]!]);
      setSelectedFolderId(created.id);
      toast.success('Subfolder created');
    } catch (err) {
      toast.error('Failed to create subfolder', { description: (err as Error).message });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Media inside will move to Uncategorized on save.')) return;
    try {
      await deleteAlbumFolder(folderId);
      const childIds = galleryFolders.filter((f) => f.parent_id === folderId).map((f) => f.id);
      setGalleryFolders((prev) => prev.filter((f) => f.id !== folderId && f.parent_id !== folderId));
      setGalleryMedia((prev) =>
        prev.map((m) =>
          m.folder_id === folderId || (m.folder_id && childIds.includes(m.folder_id))
            ? { ...m, folder_id: null }
            : m
        )
      );
      setSelectedFolderId(GALLERY_ROOT_ID);
      toast.success('Folder deleted');
    } catch (err) {
      toast.error('Failed to delete folder', { description: (err as Error).message });
    }
  };

  const eventTitle = events.find((e) => e.id === formData.eventId)?.title;

  const detailsContent = (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <AdminFormSection
          title="Publishing"
          description="Control album visibility on the public gallery"
          headerRight={<Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />}
        >
          <div className="flex items-center gap-3">
            {formData.isActive ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <p className="text-sm">{formData.isActive ? 'Visible on website' : 'Hidden from website'}</p>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Album information" description="Title, linked event, and date">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Album title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label>Linked event *</Label>
              <Select value={formData.eventId} onValueChange={(v) => setFormData({ ...formData, eventId: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="eventDate">Event date</Label>
                <Input id="eventDate" type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="h-10" />
              </div>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Cover & highlights" description="Cover image and homepage featuring">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cover image</Label>
              <ImageUpload value={formData.coverImage} onChange={(v) => setFormData({ ...formData, coverImage: (v as string) || '' })} multiple={false} previewClassName="object-cover" bucket="album-images" uploadOnSelect enableCropAdjust cropAspect={16 / 9} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Featured album</p>
                  <p className="text-xs text-muted-foreground">Highlight on homepage gallery</p>
                </div>
              </div>
              <Switch checked={formData.isFeatured} onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })} />
            </div>
          </div>
        </AdminFormSection>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className={cn(adminPanelClass, 'overflow-hidden')}>
          <div className="relative aspect-video bg-muted">
            {formData.coverImage ? <img src={formData.coverImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover</div>}
          </div>
          <div className="space-y-2 p-4">
            <p className="font-semibold">{formData.title || 'Untitled album'}</p>
            {eventTitle ? <p className="text-xs text-muted-foreground">{eventTitle}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Badge variant={formData.isActive ? 'default' : 'secondary'}>{formData.isActive ? 'Published' : 'Draft'}</Badge>
              {formData.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      title={isNew ? 'New album' : formData.title || 'Edit album'}
      subtitle={isNew ? 'Create an event album' : 'Event album · details & gallery'}
      backHref="/admin/albums"
      backLabel="Albums"
      loading={loading}
      saving={saving}
      onSave={() => void handleSave()}
      onDelete={!isNew ? () => void handleDelete() : undefined}
      tabs={[
        { value: 'details', label: 'Details' },
        { value: 'gallery', label: 'Gallery', disabled: isNew },
      ]}
      details={detailsContent}
      gallery={
        !isNew ? (
          <div className="space-y-3">
            <AdminMediaExplorer
              folders={galleryFolders}
              media={galleryMedia}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onFoldersChange={setGalleryFolders}
              onMediaChange={setGalleryMedia}
              uploadBucket="album-images"
              onCreateRootFolder={handleCreateRootFolder}
              onCreateSubfolder={handleCreateSubfolder}
              onDeleteFolder={handleDeleteFolder}
              creatingFolder={creatingFolder}
            />
            <p className="text-xs text-muted-foreground">Save changes after uploading or editing folders.</p>
          </div>
        ) : undefined
      }
    />
  );
}
