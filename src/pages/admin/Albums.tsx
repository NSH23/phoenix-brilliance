import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Image, Video, Star, MoreHorizontal, Calendar, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getAllAlbums, createAlbum, updateAlbum, deleteAlbum, Album } from '@/services/albums';
import { getAllEvents, Event } from '@/services/events';
import { getAlbumMedia } from '@/services/albums';
import { toast } from 'sonner';

interface AlbumWithMediaCount extends Album {
  mediaCount?: number;
  eventTitle?: string;
}

export default function AdminAlbums() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [albums, setAlbums] = useState<AlbumWithMediaCount[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumWithMediaCount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    description: '',
    cover_image: '',
    event_date: '',
    is_featured: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Quick Action: open Create dialog when ?add=1
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      handleOpenDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('add')]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [albumsData, eventsData] = await Promise.all([
        getAllAlbums(),
        getAllEvents()
      ]);

      setEvents(eventsData);

      // Load media count for each album
      const albumsWithCounts = await Promise.all(
        albumsData.map(async (album: any) => {
          try {
            const media = await getAlbumMedia(album.id);
            const event = eventsData.find(e => e.id === album.event_id);
            return {
              ...album,
              mediaCount: media.length,
              eventTitle: event?.title || 'Unknown Event',
            };
          } catch (error) {
            logger.error('Error loading media for album', error, { component: 'AdminAlbums', action: 'loadAlbumMedia', albumId: album.id });
            const event = eventsData.find(e => e.id === album.event_id);
            return {
              ...album,
              mediaCount: 0,
              eventTitle: event?.title || 'Unknown Event',
            };
          }
        })
      );

      setAlbums(albumsWithCounts);
    } catch (error: any) {
      logger.error('Error loading albums', error, { component: 'AdminAlbums', action: 'loadAlbums' });
      toast.error('Failed to load albums', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = filterEvent === 'all' || album.event_id === filterEvent;
    return matchesSearch && matchesEvent;
  });

  const handleOpenDialog = (album?: AlbumWithMediaCount) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        event_id: album.event_id,
        title: album.title,
        description: album.description || '',
        cover_image: album.cover_image || '',
        event_date: album.event_date || '',
        is_featured: album.is_featured || false,
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        event_id: '',
        title: '',
        description: '',
        cover_image: '',
        event_date: '',
        is_featured: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.event_id) {
      toast.error('Please fill in required fields', {
        description: 'Title and event type are required.',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingAlbum) {
        // Update existing album
        const updated = await updateAlbum(editingAlbum.id, formData);
        const event = events.find(e => e.id === updated.event_id);
        const media = await getAlbumMedia(updated.id);
        const updatedWithCount: AlbumWithMediaCount = {
          ...updated,
          mediaCount: media.length,
          eventTitle: event?.title || 'Unknown Event',
        };
        setAlbums(albums.map(a => a.id === editingAlbum.id ? updatedWithCount : a));
        toast.success('Album updated successfully');
      } else {
        // Create new album
        const newAlbum = await createAlbum(formData);
        const event = events.find(e => e.id === newAlbum.event_id);
        const newAlbumWithCount: AlbumWithMediaCount = {
          ...newAlbum,
          mediaCount: 0,
          eventTitle: event?.title || 'Unknown Event',
        };
        setAlbums([...albums, newAlbumWithCount]);
        toast.success('Album created successfully');
      }

      setIsDialogOpen(false);
    } catch (error: any) {
      logger.error('Error saving album', error, { component: 'AdminAlbums', action: 'saveAlbum', editingAlbum: !!editingAlbum });
      toast.error(editingAlbum ? 'Failed to update album' : 'Failed to create album', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album? This will also delete all media in the album.')) {
      return;
    }

    try {
      await deleteAlbum(id);
      setAlbums(albums.filter(a => a.id !== id));
      toast.success('Album deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting album', error, { component: 'AdminAlbums', action: 'deleteAlbum', albumId: id });
      toast.error('Failed to delete album', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const toggleFeatured = async (id: string) => {
    const album = albums.find(a => a.id === id);
    if (!album) return;

    try {
      const updated = await updateAlbum(id, { is_featured: !album.is_featured });
      const event = events.find(e => e.id === updated.event_id);
      const updatedWithCount: AlbumWithMediaCount = {
        ...updated,
        mediaCount: album.mediaCount || 0,
        eventTitle: event?.title || 'Unknown Event',
      };
      setAlbums(albums.map(a => a.id === id ? updatedWithCount : a));
      toast.success(`Album ${updated.is_featured ? 'featured' : 'unfeatured'}`);
    } catch (error: any) {
      logger.error('Error toggling featured status', error, { component: 'AdminAlbums', action: 'toggleFeatured', albumId: id });
      toast.error('Failed to update album', {
        description: error.message || 'Please try again.',
      });
    }
  };

  return (
    <AdminLayout title="Albums" subtitle="Manage event albums and their media">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map(event => (
              <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Album
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Albums Grid */}
          {filteredAlbums.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No albums found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterEvent !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first album to get started'}
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Album
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {filteredAlbums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
                    <div className="relative h-24 md:h-52 overflow-hidden shrink-0">
                      <img
                        src={album.cover_image || '/placeholder.svg'}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-1 left-1 md:top-3 md:left-3 flex gap-1 md:gap-2">
                        <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[8px] px-1 py-0 md:text-xs md:px-2.5 md:py-0.5 line-clamp-1 max-w-[60px] md:max-w-none">
                          {album.eventTitle}
                        </Badge>
                        {album.is_featured && (
                          <Badge className="bg-primary text-primary-foreground gap-0.5 px-1 py-0 md:gap-1 md:px-2.5 md:py-0.5 text-[8px] md:text-xs">
                            <Star className="w-2 h-2 md:w-3 md:h-3 fill-current" /> <span className="hidden md:inline">Featured</span>
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-1 right-1 md:top-3 md:right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-6 w-6 md:h-8 md:w-8 bg-black/50 border-0 text-white hover:bg-black/70 text-white">
                              <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(album)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `/admin/gallery?album=${album.id}`}>
                              <Image className="w-4 h-4 mr-2" /> Manage Media
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFeatured(album.id)}>
                              <Star className="w-4 h-4 mr-2" />
                              {album.is_featured ? 'Remove Featured' : 'Set Featured'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(album.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Info Overlay */}
                      <div className="absolute bottom-1 left-1 right-1 md:bottom-3 md:left-3 md:right-3">
                        <h3 className="text-xs md:text-lg font-serif font-bold text-white line-clamp-1">{album.title}</h3>
                        <div className="flex items-center gap-1 md:gap-3 mt-0.5 md:mt-1 text-white/80 text-[8px] md:text-xs">
                          {album.event_date && (
                            <span className="flex items-center gap-0.5 md:gap-1">
                              <Calendar className="w-2 h-2 md:w-3 md:h-3" />
                              <span className="hidden md:inline">{new Date(album.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="md:hidden">{new Date(album.event_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 md:gap-1 ml-auto md:ml-0">
                            <Image className="w-2 h-2 md:w-3 md:h-3" />
                            {album.mediaCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-2 md:p-4 hidden md:block">
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {album.description || 'No description'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
            <DialogDescription>
              {editingAlbum ? 'Update the album details below.' : 'Create a new album for your event photos and videos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventId">Event Type *</Label>
              <Select
                value={formData.event_id}
                onValueChange={(value) => setFormData({ ...formData, event_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Album Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sharma Wedding 2024"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this album..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <ImageUpload
                label="Cover Image"
                value={formData.cover_image}
                onChange={(value) => setFormData({ ...formData, cover_image: value as string })}
                multiple={false}
                previewClassName="object-cover"
                bucket="album-images"
                uploadOnSelect={true}
              />
              {formData.cover_image && (
                <p className="text-xs text-muted-foreground">
                  Or enter URL manually:
                </p>
              )}
              <Input
                id="coverImage"
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="/path/to/image.jpg or upload above"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>

            {formData.cover_image && (
              <div className="relative h-40 rounded-lg overflow-hidden">
                <img
                  src={formData.cover_image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="isFeatured">Featured Album</Label>
              <Switch
                id="isFeatured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingAlbum ? 'Save Changes' : 'Create Album'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
