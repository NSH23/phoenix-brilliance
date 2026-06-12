import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Star, Upload } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import ImageUpload from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  adminPanelClass,
  adminRecordEditFormStackClass,
  adminRecordEditLayoutClass,
  adminRecordEditPreviewAsideClass,
} from '@/components/admin/adminStyles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Album,
  createAlbum,
  createAlbumMedia,
  deleteAlbum,
  getAlbumForAdminEdit,
  updateAlbum,
} from '@/services/albums';
import { getAllEvents, Event } from '@/services/events';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

export default function AlbumEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventId: '',
    coverImage: '',
    eventDate: '',
    isFeatured: false,
    isActive: true,
  });
  const [albumImages, setAlbumImages] = useState<string[]>([]);

  useEffect(() => {
    void getAllEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  const loadAlbum = useCallback(
    async (targetId: string) => {
      setLoading(true);
      try {
        const full = await getAlbumForAdminEdit(targetId);
        setEditingAlbum(full);
        setPhotoCount((full.album_media || []).filter((m) => m.type === 'image' && m.url).length);
        setFormData({
          title: full.title,
          description: full.description || '',
          eventId: full.event_id,
          coverImage: full.cover_image || '',
          eventDate: full.event_date ? full.event_date.slice(0, 10) : '',
          isFeatured: full.is_featured ?? false,
          isActive: full.is_active ?? true,
        });
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
      setEditingAlbum(null);
      setPhotoCount(0);
      setLoading(false);
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
        const created = await createAlbum({ ...base, display_order: 0 });
        for (let i = 0; i < albumImages.length; i++) {
          await createAlbumMedia({
            album_id: created.id,
            type: 'image',
            url: albumImages[i],
            youtube_url: null,
            caption: null,
            is_featured: false,
            display_order: i,
            folder_id: null,
          });
        }
        toast.success('Album created');
        navigate(`/admin/albums/${created.id}/edit`, { replace: true });
        return;
      }

      if (!editingAlbum) return;
      await updateAlbum(editingAlbum.id, base);
      toast.success('Album saved');
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

  const eventTitle = events.find((e) => e.id === formData.eventId)?.title;

  const detailsContent = (
    <div className={adminRecordEditLayoutClass}>
      <div className={adminRecordEditFormStackClass}>
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
              <ImageUpload
                value={formData.coverImage}
                onChange={(v) => setFormData({ ...formData, coverImage: (v as string) || '' })}
                multiple={false}
                previewFit="contain"
                previewAspectRatio={16 / 9}
                bucket="album-images"
                uploadOnSelect
                enableCropAdjust
                cropAspect={16 / 9}
                adjustTitle="Adjust cover image"
              />
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

        {isNew ? (
          <AdminFormSection title="Initial photos" description="Optional — add more after saving">
            <ImageUpload
              value={albumImages}
              onChange={(v) => setAlbumImages((v as string[]) || [])}
              multiple
              maxFiles={50}
              previewFit="contain"
              bucket="album-images"
              uploadOnSelect
            />
          </AdminFormSection>
        ) : null}
      </div>

      <aside className={cn(adminRecordEditPreviewAsideClass, 'space-y-3')}>
        <div className={cn(adminPanelClass, 'overflow-hidden')}>
          <div className="relative aspect-video bg-muted">
            {formData.coverImage ? (
              <img src={formData.coverImage} alt="" className="h-full w-full object-contain bg-muted/25 p-2" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover</div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="font-semibold">{formData.title || 'Untitled album'}</p>
            {eventTitle ? <p className="text-xs text-muted-foreground">{eventTitle}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Badge variant={formData.isActive ? 'default' : 'secondary'}>{formData.isActive ? 'Published' : 'Draft'}</Badge>
              {formData.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
              {!isNew ? <Badge variant="outline">{photoCount} photos</Badge> : null}
            </div>
          </div>
        </div>

        {!isNew && editingAlbum ? (
          <Link
            to={`/admin/albums/${editingAlbum.id}/photos`}
            className={cn(
              adminPanelClass,
              'flex w-full flex-col items-center justify-center gap-2 border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.08]'
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Upload className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-foreground">Upload</span>
            <span className="text-[11px] text-muted-foreground">Add & manage photos</span>
          </Link>
        ) : null}
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      key={id}
      title={isNew ? 'New album' : formData.title || 'Edit album'}
      subtitle={isNew ? 'Create an event album' : 'Edit album details'}
      backHref="/admin/albums"
      backLabel="Albums"
      loading={loading}
      saving={saving}
      onSave={() => void handleSave()}
      onDelete={!isNew ? () => void handleDelete() : undefined}
      singlePage
      tabs={[{ value: 'details', label: 'Details' }]}
      details={detailsContent}
    />
  );
}
