import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import ImageUpload from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { adminPanelClass } from '@/components/admin/adminStyles';
import { createEvent, deleteEvent, getEventById, updateEvent } from '@/services/events';
import { getEventImages, setEventImages } from '@/services/eventImages';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

const MAX_EVENT_IMAGES = 5;

export default function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    cover_image: '',
    powered_by: '',
    is_active: true,
    display_order: 0,
  });
  const [eventImages, setEventImagesForm] = useState<string[]>([]);

  const loadEvent = useCallback(
    async (eventId: string) => {
      setLoading(true);
      try {
        const event = await getEventById(eventId);
        setFormData({
          title: event.title,
          slug: event.slug,
          short_description: event.short_description || '',
          description: event.description || '',
          cover_image: event.cover_image || '',
          powered_by: event.powered_by || '',
          is_active: event.is_active,
          display_order: event.display_order,
        });
        const imgs = await getEventImages(eventId);
        setEventImagesForm(imgs.map((i) => i.url));
      } catch (err) {
        logger.error('Failed to load event', err, { component: 'EventEditPage' });
        toast.error('Failed to load event');
        navigate('/admin/events');
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!isNew && id) void loadEvent(id);
  }, [id, isNew, loadEvent]);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Title and URL slug are required');
      return;
    }
    if (eventImages.length > MAX_EVENT_IMAGES) {
      toast.error(`Maximum ${MAX_EVENT_IMAGES} homepage images allowed`);
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await createEvent(formData);
        await setEventImages(created.id, eventImages);
        toast.success('Event created');
        navigate(`/admin/events/${created.id}/edit`, { replace: true });
        return;
      }
      if (!id) return;
      await updateEvent(id, formData);
      await setEventImages(id, eventImages);
      toast.success('Event saved');
      void loadEvent(id);
    } catch (err) {
      toast.error('Save failed', { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew || !confirm('Delete this event permanently?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
      navigate('/admin/events');
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    }
  };

  const detailsContent = (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <AdminFormSection
          title="Publishing"
          description="Control visibility on the public website"
          headerRight={
            <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
          }
        >
          <div className="flex items-center gap-3">
            {formData.is_active ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <p className="text-sm">{formData.is_active ? 'Published — visible to customers' : 'Draft — hidden from website'}</p>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Event details" description="Title, slug, and descriptions">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData({
                    ...formData,
                    title,
                    slug: isNew ? generateSlug(title) : formData.slug,
                  });
                }}
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="h-10 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Public URL: /events/{formData.slug || '…'}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="short_description">Short description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="powered_by">Powered by</Label>
                <Input
                  id="powered_by"
                  value={formData.powered_by}
                  onChange={(e) => setFormData({ ...formData, powered_by: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display_order">Display order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Media" description="Cover image and homepage polaroid frames">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>Cover image</Label>
              <ImageUpload
                value={formData.cover_image}
                onChange={(v) => setFormData({ ...formData, cover_image: (v as string) || '' })}
                multiple={false}
                previewClassName="object-cover"
                bucket="event-images"
                uploadOnSelect
                enableCropAdjust
                cropAspect={16 / 9}
              />
            </div>
            <div className="space-y-2">
              <Label>Homepage images (0–{MAX_EVENT_IMAGES})</Label>
              <ImageUpload
                value={eventImages}
                onChange={(v) => setEventImagesForm((v as string[]) || [])}
                multiple
                maxFiles={MAX_EVENT_IMAGES}
                previewClassName="object-cover"
                bucket="event-images"
                uploadOnSelect
              />
            </div>
          </div>
        </AdminFormSection>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className={cn(adminPanelClass, 'overflow-hidden')}>
          <div className="relative aspect-video bg-muted">
            {formData.cover_image ? (
              <img src={formData.cover_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover</div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="font-semibold">{formData.title || 'Untitled event'}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                {formData.is_active ? 'Published' : 'Draft'}
              </Badge>
              <Badge variant="outline">{eventImages.length} homepage imgs</Badge>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      title={isNew ? 'New event' : formData.title || 'Edit event'}
      subtitle={isNew ? 'Create an event type' : 'Event type · content & media'}
      backHref="/admin/events"
      backLabel="Events"
      loading={loading}
      saving={saving}
      onSave={() => void handleSave()}
      onDelete={!isNew ? () => void handleDelete() : undefined}
      tabs={[{ value: 'details', label: 'Details' }]}
      details={detailsContent}
    />
  );
}
