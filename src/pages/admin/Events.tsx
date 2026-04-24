import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { AdminSortableGrid, AdminSortableItem } from '@/components/admin/AdminSortableGrid';
import { logger } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getAllEvents, createEvent, updateEvent, deleteEvent, Event } from '@/services/events';
import { getEventImages, setEventImages } from '@/services/eventImages';
import { toast } from 'sonner';

const MIN_EVENT_IMAGES = 0;
const MAX_EVENT_IMAGES = 5;

export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
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

  // Load events from database
  useEffect(() => {
    loadEvents();
  }, []);

  // Quick Action: open Add dialog when ?add=1
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      handleOpenDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('add')]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getAllEvents();
      setEvents(data);
    } catch (error: unknown) {
      logger.error('Error loading events', error, { component: 'AdminEvents', action: 'loadEvents' });
      toast.error('Failed to load events', {
        description: (error as Error)?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showReorder = !searchQuery.trim();
  const listForCards = showReorder
    ? [...events].sort((a, b) => a.display_order - b.display_order)
    : filteredEvents;

  const persistEventOrder = async (orderedIds: string[]) => {
    setIsReordering(true);
    try {
      await Promise.all(orderedIds.map((id, i) => updateEvent(id, { display_order: i })));
      setEvents((prev) => {
        const byId = new Map(prev.map((e) => [e.id, e]));
        return orderedIds.map((id, i) => ({ ...byId.get(id)!, display_order: i }));
      });
      toast.success('Display order saved');
    } catch (error: unknown) {
      logger.error('Error saving event order', error, { component: 'AdminEvents', action: 'persistOrder' });
      toast.error('Failed to save order', {
        description: (error as Error)?.message || 'Please try again.',
      });
      void loadEvents();
    } finally {
      setIsReordering(false);
    }
  };

  const handleOpenDialog = async (event?: Event) => {
    if (event) {
      setEditingEvent(event);
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
      try {
        const imgs = await getEventImages(event.id);
        setEventImagesForm(imgs.map((i) => i.url));
      } catch {
        setEventImagesForm([]);
      }
    } else {
      setEditingEvent(null);
      const nextOrder = events.length > 0 ? Math.max(...events.map((e) => e.display_order)) + 1 : 0;
      setFormData({
        title: '',
        slug: '',
        short_description: '',
        description: '',
        cover_image: '',
        powered_by: '',
        is_active: true,
        display_order: nextOrder,
      });
      setEventImagesForm([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast.error('Please fill in required fields', {
        description: 'Title and slug are required.',
      });
      return;
    }

    if (eventImages.length > MAX_EVENT_IMAGES) {
      toast.error('Event images required', {
        description: `Add up to ${MAX_EVENT_IMAGES} images for homepage display.`,
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, formData);
        await setEventImages(editingEvent.id, eventImages);
        setEvents(events.map((e) => (e.id === editingEvent.id ? updated : e)));
        toast.success('Event updated successfully');
      } else {
        const newEvent = await createEvent(formData);
        await setEventImages(newEvent.id, eventImages);
        setEvents([...events, newEvent]);
        toast.success('Event created successfully');
      }

      setIsDialogOpen(false);
    } catch (error: unknown) {
      logger.error('Error saving event', error, { component: 'AdminEvents', action: 'saveEvent', editingEvent: !!editingEvent });
      toast.error(editingEvent ? 'Failed to update event' : 'Failed to create event', {
        description: (error as Error)?.message || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting event', error, { component: 'AdminEvents', action: 'deleteEvent', eventId: id });
      toast.error('Failed to delete event', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event) return;

    try {
      const updated = await updateEvent(id, { is_active: !event.is_active });
      setEvents(events.map(e => e.id === id ? updated : e));
      toast.success(`Event ${updated.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      logger.error('Error toggling event status', error, { component: 'AdminEvents', action: 'toggleEventStatus', eventId: id });
      toast.error('Failed to update event status', {
        description: error.message || 'Please try again.',
      });
    }
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const renderEventCard = (event: Event, badgeShiftForDrag: boolean) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col max-md:flex-row max-md:items-start max-md:gap-3">
      <div className="relative h-24 md:h-48 overflow-hidden shrink-0 max-md:h-24 max-md:w-24 max-md:rounded-lg">
        <img
          src={event.cover_image || '/placeholder.svg'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div
          className={`absolute top-1 max-md:hidden md:top-3 ${badgeShiftForDrag ? 'left-11 md:left-12' : 'left-1 md:left-3'}`}
        >
          <Badge
            variant={event.is_active ? 'default' : 'secondary'}
            className="text-[10px] px-1 py-0 h-4 md:text-xs md:px-2 md:py-0.5 md:h-auto"
          >
            {event.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="absolute top-1 right-1 md:top-3 md:right-3 max-md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-6 w-6 md:h-8 md:w-8">
                <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(event)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/events/${event.slug}`, '_blank')}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-1 left-1 right-1 md:bottom-3 md:left-3 md:right-3 max-md:hidden">
          <h3 className="text-xs md:text-xl font-serif font-bold text-white line-clamp-1">{event.title}</h3>
        </div>
      </div>
      <CardContent className="p-2 md:p-4 flex-1 flex flex-col justify-between gap-2 min-w-0">
        <div className="hidden max-md:flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="text-sm font-serif font-bold text-foreground line-clamp-2 leading-tight">{event.title}</h3>
            <Badge variant={event.is_active ? 'default' : 'secondary'} className="text-xs px-2 py-0.5 h-auto mt-1">
              {event.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-10 w-10">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(event)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/events/${event.slug}`, '_blank')}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 md:hidden">
          {event.short_description || event.description || 'No description'}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 hidden md:block">
          {event.short_description || event.description || 'No description'}
        </p>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-0 mt-auto">
          <span className="text-xs text-muted-foreground">Order: {event.display_order}</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={event.is_active}
              onCheckedChange={() => handleToggleActive(event.id)}
              className="h-6 w-11"
            />
            <span className="text-xs text-muted-foreground max-md:inline md:hidden">
              {event.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="md:hidden grid grid-cols-2 gap-2 mt-1">
          <Button variant="outline" size="sm" className="h-10" onClick={() => handleOpenDialog(event)}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => window.open(`/events/${event.slug}`, '_blank')}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Events" subtitle="Manage your event types and their details">


      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 max-md:w-full">
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No events found</p>
              <Button onClick={() => handleOpenDialog()}>Create Your First Event</Button>
            </div>
          ) : (
            <>
              {events.length >= 2 && (
                <p className="text-xs text-muted-foreground mb-2">
                  {showReorder
                    ? 'Drag the grip on a card to reorder. Changes apply on the site immediately.'
                    : 'Clear search to drag and reorder cards.'}
                </p>
              )}
              {showReorder ? (
                <AdminSortableGrid
                  itemIds={listForCards.map((e) => e.id)}
                  disabled={isReordering}
                  onReorder={persistEventOrder}
                  className="relative grid grid-cols-3 gap-2 md:grid-cols-3 lg:grid-cols-3 md:gap-6 max-md:grid-cols-1"
                >
                  {listForCards.map((event, index) => (
                    <AdminSortableItem key={event.id} id={event.id} disabled={isReordering} handleTone="dark">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {renderEventCard(event, true)}
                      </motion.div>
                    </AdminSortableItem>
                  ))}
                </AdminSortableGrid>
              ) : (
                <div className="grid grid-cols-3 gap-2 md:grid-cols-3 lg:grid-cols-3 md:gap-6 max-md:grid-cols-1">
                  {listForCards.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {renderEventCard(event, false)}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update the event details below.' : 'Create a new event type for your services.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData({
                    ...formData,
                    title,
                    slug: editingEvent ? formData.slug : generateSlug(title)
                  });
                }}
                placeholder="e.g., Car Opening"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., car-opening"
              />
              <p className="text-xs text-muted-foreground">
                Used in URL: /events/{formData.slug || 'event-slug'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief tagline for the event"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the event..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="poweredBy">Powered By</Label>
              <Input
                id="poweredBy"
                value={formData.powered_by}
                onChange={(e) => setFormData({ ...formData, powered_by: e.target.value })}
                placeholder="e.g., Partner Name or Brand"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Shown on the homepage events section when set. Leave empty to hide.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Cover Image</Label>
              <ImageUpload
                value={formData.cover_image}
                onChange={(value) => setFormData({ ...formData, cover_image: value as string })}
                multiple={false}
                previewClassName="object-cover"
                bucket="event-images"
                uploadOnSelect={true}
              />
              {formData.cover_image && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, cover_image: '' })}
                  >
                    Remove Cover Image
                  </Button>
                </div>
              )}
              {formData.cover_image && (
                <Input
                  id="coverImage"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="Or enter URL manually"
                  className="mt-1"
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label>
                Event Images (Homepage)
                <span className="text-muted-foreground font-normal ml-2">
                  0–{MAX_EVENT_IMAGES} images
                </span>
              </Label>
              <p className="text-xs text-muted-foreground">
                These images appear in polaroid-style frames on the homepage events section.
              </p>
              <ImageUpload
                value={eventImages}
                onChange={(value) => setEventImagesForm(value as string[])}
                multiple={true}
                maxFiles={MAX_EVENT_IMAGES}
                previewClassName="object-cover"
                bucket="event-images"
                uploadOnSelect={true}
              />
              {eventImages.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {eventImages.length} / {MAX_EVENT_IMAGES} images
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEventImagesForm([])}
                  >
                    Remove All Event Images
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Events are sorted by this value.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch
                id="isActive"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter className="max-md:flex-col max-md:items-stretch max-md:gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="max-md:w-full">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="max-md:w-full max-md:h-11"
              disabled={
                isSaving ||
                eventImages.length > MAX_EVENT_IMAGES
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingEvent ? 'Save Changes' : 'Create Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
