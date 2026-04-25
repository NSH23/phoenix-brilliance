import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Image, Star, MoreHorizontal, Calendar, Loader2, Video, Play } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import {
  getAllAlbums,
  getAdminAlbumsPage,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  Album,
  getAllAlbumMediaCounts,
  AlbumMedia,
  getAlbumMedia,
  createAlbumMedia,
  deleteAlbumMedia,
} from '@/services/albums';
import { getAllEvents, Event } from '@/services/events';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

type PendingAlbumYoutube = { youtubeId: string; posterUrl: string; caption: string };

interface AlbumWithMediaCount extends Album {
  mediaCount?: number;
  eventTitle?: string;
}

export default function AdminAlbums() {
  const PAGE_SIZE = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const [albums, setAlbums] = useState<AlbumWithMediaCount[]>([]);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumWithMediaCount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialDialogState, setInitialDialogState] = useState('');
  const [albumMedia, setAlbumMedia] = useState<AlbumMedia[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [pendingNewAlbumFiles, setPendingNewAlbumFiles] = useState<File[]>([]);
  const [pendingNewAlbumPreviews, setPendingNewAlbumPreviews] = useState<string[]>([]);
  const [pendingNewAlbumVideos, setPendingNewAlbumVideos] = useState<PendingAlbumYoutube[]>([]);
  const [albumVideoYoutube, setAlbumVideoYoutube] = useState('');
  const [albumVideoThumb, setAlbumVideoThumb] = useState('');
  const [albumVideoCaption, setAlbumVideoCaption] = useState('');
  const [formData, setFormData] = useState({
    event_id: '',
    title: '',
    description: '',
    cover_image: '',
    event_date: '',
    is_featured: false,
  });
  const serializeDialogState = (nextFormData: typeof formData) => JSON.stringify(nextFormData);

  const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const currentQuery = (searchParams.get('q') || '').trim();
  const currentEventFilter = searchParams.get('event') || 'all';

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    setFilterEvent(currentEventFilter);
  }, [currentEventFilter]);

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
      const [albumsResult, eventsData, mediaCounts] = await Promise.all([
        getAdminAlbumsPage({
          page: currentPage - 1,
          pageSize: PAGE_SIZE,
          searchQuery: currentQuery,
          eventId: currentEventFilter,
        }),
        getAllEvents(),
        getAllAlbumMediaCounts(),
      ]);

      setEvents(eventsData);
      const albumsWithCounts = albumsResult.data.map((album: any) => {
        const event = eventsData.find(e => e.id === album.event_id);
        return {
          ...album,
          mediaCount: mediaCounts[album.id] ?? 0,
          eventTitle: event?.title || 'Unknown Event',
        };
      });

      setAlbums(albumsWithCounts);
      setTotalAlbums(albumsResult.total);
    } catch (error: any) {
      logger.error('Error loading albums', error, { component: 'AdminAlbums', action: 'loadAlbums' });
      toast.error('Failed to load albums', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, currentQuery, currentEventFilter]);

  const updateQueryParams = (next: { page?: number; q?: string; event?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (next.q !== undefined) {
      if (next.q.trim()) params.set('q', next.q.trim());
      else params.delete('q');
    }
    if (next.event !== undefined) {
      if (next.event && next.event !== 'all') params.set('event', next.event);
      else params.delete('event');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    setSearchParams(params, { replace: true });
  };
  const totalPages = Math.max(1, Math.ceil(totalAlbums / PAGE_SIZE));

  const handleOpenDialog = (album?: AlbumWithMediaCount) => {
    setAlbumMedia([]);
    setSelectedMediaIds(new Set());
    setPendingNewAlbumFiles([]);
    setPendingNewAlbumPreviews([]);
    setPendingNewAlbumVideos([]);
    setAlbumVideoYoutube('');
    setAlbumVideoThumb('');
    setAlbumVideoCaption('');
    setMediaUploadProgress(0);
    if (album) {
      setEditingAlbum(album);
      const next = {
        event_id: album.event_id,
        title: album.title,
        description: album.description || '',
        cover_image: album.cover_image || '',
        event_date: album.event_date || '',
        is_featured: album.is_featured || false,
      };
      setFormData(next);
      setInitialDialogState(serializeDialogState(next));
    } else {
      setEditingAlbum(null);
      const next = {
        event_id: '',
        title: '',
        description: '',
        cover_image: '',
        event_date: '',
        is_featured: false,
      };
      setFormData(next);
      setInitialDialogState(serializeDialogState(next));
    }
    setIsDirty(false);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!isDialogOpen || !initialDialogState) return;
    setIsDirty(serializeDialogState(formData) !== initialDialogState);
  }, [formData, isDialogOpen, initialDialogState]);

  useEffect(() => {
    const loadMedia = async () => {
      if (!editingAlbum?.id || !isDialogOpen) return;
      setIsMediaLoading(true);
      try {
        const media = await getAlbumMedia(editingAlbum.id);
        setAlbumMedia(media);
      } catch (error: any) {
        toast.error('Failed to load album images', {
          description: error?.message || 'Please try again.',
        });
      } finally {
        setIsMediaLoading(false);
      }
    };
    loadMedia();
  }, [editingAlbum?.id, isDialogOpen]);

  const toggleMediaSelection = (mediaId: string, checked: boolean) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(mediaId);
      else next.delete(mediaId);
      return next;
    });
  };

  const toggleSelectAllMedia = (checked: boolean) => {
    if (!checked) {
      setSelectedMediaIds(new Set());
      return;
    }
    setSelectedMediaIds(new Set(albumMedia.map((m) => m.id)));
  };

  const clearPendingNewAlbumFiles = () => {
    pendingNewAlbumPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingNewAlbumFiles([]);
    setPendingNewAlbumPreviews([]);
  };

  const uploadAlbumFilesWithProgress = async (files: File[]) => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadToCloudinary(files[i], 'album-images', (filePercent) => {
        const overall = Math.round(((i + filePercent / 100) / files.length) * 100);
        setMediaUploadProgress(overall);
      });
      uploadedUrls.push(url);
    }
    setMediaUploadProgress(100);
    return uploadedUrls;
  };

  const handleBulkUploadMedia = async (files: FileList | null, targetAlbumId?: string) => {
    if (!files || files.length === 0) return;
    const uploadFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (uploadFiles.length === 0) {
      toast.error('Please select valid image files.');
      return;
    }

    const albumId = targetAlbumId || editingAlbum?.id;
    if (!albumId) {
      const nextFiles = [...pendingNewAlbumFiles, ...uploadFiles];
      const nextPreviews = [...pendingNewAlbumPreviews, ...uploadFiles.map((file) => URL.createObjectURL(file))];
      setPendingNewAlbumFiles(nextFiles);
      setPendingNewAlbumPreviews(nextPreviews);
      toast.success(`${uploadFiles.length} image(s) added. Save album to upload.`);
      return;
    }

    setIsMediaUploading(true);
    setMediaUploadProgress(0);
    try {
      const uploadedUrls = await uploadAlbumFilesWithProgress(uploadFiles);
      const startOrder =
        albumMedia.length > 0
          ? Math.max(...albumMedia.map((m) => m.display_order ?? 0)) + 1
          : 0;
      const createdMedia = await Promise.all(
        uploadedUrls.map((url, index) =>
          createAlbumMedia({
            album_id: editingAlbum.id,
            type: 'image',
            url,
            youtube_url: null,
            caption: null,
            is_featured: false,
            display_order: startOrder + index,
          })
        )
      );
      setAlbumMedia((prev) => [...prev, ...createdMedia]);
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === albumId
            ? { ...a, mediaCount: (a.mediaCount || 0) + createdMedia.length }
            : a
        )
      );
      toast.success(`${createdMedia.length} image(s) uploaded`);
    } catch (error: any) {
      toast.error('Failed to upload album images', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setMediaUploadProgress(0);
      setIsMediaUploading(false);
    }
  };

  const handleAddAlbumYoutubeVideo = async () => {
    const raw = albumVideoYoutube.trim();
    if (!raw) {
      toast.error('Enter a YouTube URL or video ID.');
      return;
    }
    const id = getYouTubeId(raw);
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      toast.error('Enter a valid YouTube URL or 11-character video ID.');
      return;
    }
    const posterTrim = albumVideoThumb.trim();
    const captionTrim = albumVideoCaption.trim();
    const posterUrl = posterTrim || '';
    const caption = captionTrim || '';

    if (editingAlbum?.id) {
      try {
        const startOrder =
          albumMedia.length > 0
            ? Math.max(...albumMedia.map((m) => m.display_order ?? 0)) + 1
            : 0;
        const row = await createAlbumMedia({
          album_id: editingAlbum.id,
          type: 'video',
          url: posterUrl || null,
          youtube_url: id,
          caption: caption || null,
          is_featured: false,
          display_order: startOrder,
        });
        setAlbumMedia((prev) => [...prev, row]);
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === editingAlbum.id ? { ...a, mediaCount: (a.mediaCount || 0) + 1 } : a
          )
        );
        toast.success('YouTube video added to album.');
      } catch (error: unknown) {
        toast.error('Failed to add video', { description: (error as Error)?.message });
      }
    } else {
      setPendingNewAlbumVideos((prev) => [...prev, { youtubeId: id, posterUrl, caption }]);
      toast.success('Video queued. It will be saved when you create the album.');
    }
    setAlbumVideoYoutube('');
    setAlbumVideoThumb('');
    setAlbumVideoCaption('');
  };

  const handleDeleteSelectedMedia = async () => {
    if (!editingAlbum?.id || selectedMediaIds.size === 0) return;
    if (!confirm(`Delete ${selectedMediaIds.size} selected item(s)?`)) return;
    setIsDeletingMedia(true);
    try {
      const ids = Array.from(selectedMediaIds);
      await Promise.all(ids.map((id) => deleteAlbumMedia(id)));
      setAlbumMedia((prev) => prev.filter((m) => !selectedMediaIds.has(m.id)));
      setSelectedMediaIds(new Set());
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === editingAlbum.id
            ? { ...a, mediaCount: Math.max(0, (a.mediaCount || 0) - ids.length) }
            : a
        )
      );
      toast.success('Selected items deleted');
    } catch (error: any) {
      toast.error('Failed to delete selected images', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsDeletingMedia(false);
    }
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
        const updatedWithCount: AlbumWithMediaCount = {
          ...updated,
          mediaCount: editingAlbum.mediaCount || 0,
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
        if (pendingNewAlbumFiles.length > 0) {
          setIsMediaUploading(true);
          setMediaUploadProgress(0);
          const uploadedUrls = await uploadAlbumFilesWithProgress(pendingNewAlbumFiles);
          const createdMedia = await Promise.all(
            uploadedUrls.map((url, index) =>
              createAlbumMedia({
                album_id: newAlbum.id,
                type: 'image',
                url,
                youtube_url: null,
                caption: null,
                is_featured: false,
                display_order: index,
              })
            )
          );
          let mediaCount = createdMedia.length;
          let order = createdMedia.length;
          const videosQueuedWithImages = pendingNewAlbumVideos.length;
          if (videosQueuedWithImages > 0) {
            await Promise.all(
              pendingNewAlbumVideos.map((v, i) =>
                createAlbumMedia({
                  album_id: newAlbum.id,
                  type: 'video',
                  url: v.posterUrl.trim() || null,
                  youtube_url: v.youtubeId,
                  caption: v.caption.trim() || null,
                  is_featured: false,
                  display_order: order + i,
                })
              )
            );
            mediaCount += videosQueuedWithImages;
            setPendingNewAlbumVideos([]);
          }
          newAlbumWithCount.mediaCount = mediaCount;
          toast.success(
            videosQueuedWithImages > 0
              ? `Album created with ${createdMedia.length} image(s) and ${videosQueuedWithImages} video(s).`
              : `Album created and ${createdMedia.length} image(s) uploaded`
          );
          clearPendingNewAlbumFiles();
        } else if (pendingNewAlbumVideos.length > 0) {
          const videosOnlyCount = pendingNewAlbumVideos.length;
          await Promise.all(
            pendingNewAlbumVideos.map((v, i) =>
              createAlbumMedia({
                album_id: newAlbum.id,
                type: 'video',
                url: v.posterUrl.trim() || null,
                youtube_url: v.youtubeId,
                caption: v.caption.trim() || null,
                is_featured: false,
                display_order: i,
              })
            )
          );
          newAlbumWithCount.mediaCount = videosOnlyCount;
          setPendingNewAlbumVideos([]);
          toast.success(`Album created with ${videosOnlyCount} video(s).`);
        } else {
          toast.success('Album created successfully');
        }
        setAlbums([...albums, newAlbumWithCount]);
      }

      setIsDialogOpen(false);
      setIsDirty(false);
    } catch (error: any) {
      logger.error('Error saving album', error, { component: 'AdminAlbums', action: 'saveAlbum', editingAlbum: !!editingAlbum });
      toast.error(editingAlbum ? 'Failed to update album' : 'Failed to create album', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setMediaUploadProgress(0);
      setIsMediaUploading(false);
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
            onChange={(e) => {
              const v = e.target.value;
              setSearchQuery(v);
              updateQueryParams({ q: v, page: 1 });
            }}
            className="pl-10"
          />
        </div>
        <Select value={filterEvent} onValueChange={(value) => {
          setFilterEvent(value);
          updateQueryParams({ event: value, page: 1 });
        }}>
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
        <Button onClick={() => handleOpenDialog()} className="gap-2 max-md:w-full">
          <Plus className="w-4 h-4" />
          Create Album
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`albums-skeleton-${i}`} className="rounded-xl p-4 animate-pulse bg-[hsl(var(--admin-surface-2))]">
              <div className="h-4 rounded w-3/4 mb-3 bg-[hsl(var(--admin-border))]" />
              <div className="h-3 rounded w-1/2 bg-[hsl(var(--admin-border))]" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Albums Grid */}
          {albums.length === 0 ? (
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
            <div className="grid grid-cols-3 gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6 max-md:grid-cols-1">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col max-md:flex-row max-md:items-start max-md:gap-3">
                    <div className="relative h-24 md:h-52 overflow-hidden shrink-0 max-md:h-24 max-md:w-24 max-md:rounded-lg">
                      <img
                        src={album.cover_image || '/placeholder.svg'}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-1 left-1 md:top-3 md:left-3 flex gap-1 md:gap-2">
                        <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] px-1.5 py-0.5 md:text-xs md:px-2.5 md:py-0.5 line-clamp-1 max-w-[90px] md:max-w-none">
                          {album.eventTitle}
                        </Badge>
                        {album.is_featured && (
                          <Badge className="bg-primary text-primary-foreground gap-0.5 px-1.5 py-0.5 md:gap-1 md:px-2.5 md:py-0.5 text-[10px] md:text-xs">
                            <Star className="w-2 h-2 md:w-3 md:h-3 fill-current" /> <span className="hidden md:inline">Featured</span>
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-1 right-1 md:top-3 md:right-3">
                        <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-6 w-6 md:h-8 md:w-8 bg-black/50 border-0 text-white hover:bg-black/70 text-white max-md:h-10 max-md:w-10">
                              <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(album)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(album)}>
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
                      <div className="absolute bottom-1 left-1 right-1 md:bottom-3 md:left-3 md:right-3 max-md:hidden">
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
                    <CardContent className="p-2 md:p-4 flex-1 min-w-0">
                      <div className="md:hidden space-y-1">
                        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{album.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{album.eventTitle}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {album.event_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(album.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {album.mediaCount || 0}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {album.description || 'No description'}
                        </p>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 max-md:hidden">
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

      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => updateQueryParams({ page: currentPage - 1 })} disabled={currentPage <= 1}>
            Previous
          </Button>
          {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
            const page = idx + 1;
            return (
              <Button
                key={`albums-page-${page}`}
                variant={page === currentPage ? 'default' : 'outline'}
                onClick={() => updateQueryParams({ page })}
              >
                {page}
              </Button>
            );
          })}
          <Button variant="outline" onClick={() => updateQueryParams({ page: currentPage + 1 })} disabled={currentPage >= totalPages}>
            Next
          </Button>
        </div>
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
                enableCropAdjust={true}
                cropAspect={16 / 9}
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
                min="1900-01-01"
                max="2099-12-31"
              />
            </div>

            {formData.cover_image && (
              <div className="relative h-40 rounded-lg overflow-hidden">
                <img
                  src={formData.cover_image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
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

            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-medium">Album photos & videos</Label>
              {!editingAlbum ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        handleBulkUploadMedia(e.target.files);
                        e.currentTarget.value = '';
                      }}
                      className="max-md:h-11"
                    />
                  </div>
                  {pendingNewAlbumPreviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You can upload images now. They will be uploaded automatically when you create this album.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {pendingNewAlbumPreviews.length} image(s) ready to upload on Save.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {pendingNewAlbumPreviews.map((preview, index) => (
                          <div key={`${preview}-${index}`} className="space-y-2 rounded-lg border p-2">
                            <div className="aspect-square rounded-md overflow-hidden bg-muted">
                              <img src={preview} alt="Pending upload preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                URL.revokeObjectURL(pendingNewAlbumPreviews[index]);
                                setPendingNewAlbumFiles((prev) => prev.filter((_, i) => i !== index));
                                setPendingNewAlbumPreviews((prev) => prev.filter((_, i) => i !== index));
                              }}
                              className="w-full max-md:h-10"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {pendingNewAlbumVideos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{pendingNewAlbumVideos.length} video(s) queued for Save.</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pendingNewAlbumVideos.map((v, index) => (
                          <li key={`${v.youtubeId}-${index}`} className="flex items-center gap-2 rounded-md border bg-card p-2 text-xs">
                            <img
                              src={v.posterUrl.trim() || getYouTubeThumbnail(v.youtubeId)}
                              alt=""
                              className="h-12 w-20 shrink-0 rounded object-cover bg-muted"
                              loading="lazy"
                              decoding="async"
                            />
                            <span className="truncate flex-1">{v.caption || v.youtubeId}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-destructive"
                              onClick={() => setPendingNewAlbumVideos((prev) => prev.filter((_, i) => i !== index))}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        handleBulkUploadMedia(e.target.files);
                        e.currentTarget.value = '';
                      }}
                      disabled={isMediaUploading}
                      className="max-md:h-11"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteSelectedMedia}
                      disabled={selectedMediaIds.size === 0 || isDeletingMedia}
                      className="max-md:h-11"
                    >
                      {isDeletingMedia ? 'Deleting...' : `Delete Selected (${selectedMediaIds.size})`}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="select-all-media"
                      type="checkbox"
                      checked={albumMedia.length > 0 && selectedMediaIds.size === albumMedia.length}
                      onChange={(e) => toggleSelectAllMedia(e.target.checked)}
                    />
                    <Label htmlFor="select-all-media" className="text-sm">
                      Select all
                    </Label>
                  </div>

                  {isMediaLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading album media...
                    </div>
                  ) : albumMedia.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No photos or videos yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {albumMedia.map((media) => {
                        const isVideo = media.type === 'video';
                        const thumbSrc = isVideo
                          ? (media.url?.trim() || getYouTubeThumbnail(media.youtube_url || '') || '/placeholder.svg')
                          : (media.url || '/placeholder.svg');
                        const coverTarget = isVideo
                          ? (media.url?.trim() || getYouTubeThumbnail(media.youtube_url || ''))
                          : (media.url || '');
                        const coverSelected = coverTarget && formData.cover_image === coverTarget;
                        return (
                          <div key={media.id} className="space-y-2 rounded-lg border p-2">
                            <div className="aspect-square rounded-md overflow-hidden bg-muted relative">
                              <img
                                src={thumbSrc}
                                alt={media.caption || (isVideo ? 'YouTube video' : 'Album media')}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25">
                                  <Play className="w-10 h-10 text-white drop-shadow-md" fill="currentColor" />
                                </div>
                              )}
                            </div>
                            {media.caption && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{media.caption}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedMediaIds.has(media.id)}
                                onChange={(e) => toggleMediaSelection(media.id, e.target.checked)}
                              />
                              <span className="text-xs text-muted-foreground">Select</span>
                            </div>
                            <Button
                              type="button"
                              variant={coverSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setFormData((prev) => ({ ...prev, cover_image: coverTarget }))}
                              className="w-full max-md:h-10"
                              disabled={!coverTarget}
                            >
                              {coverSelected ? 'Thumbnail Selected' : 'Set as Thumbnail'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <Label className="inline-flex items-center gap-2 text-sm font-medium">
                  <Video className="w-4 h-4" />
                  Add video (YouTube)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Paste a full YouTube link or the 11-character ID. Playback is embedded from YouTube only (no video files on our storage).
                </p>
                <Input
                  value={albumVideoYoutube}
                  onChange={(e) => setAlbumVideoYoutube(e.target.value)}
                  placeholder="YouTube URL or video ID"
                  className="max-md:h-11"
                />
                <Input
                  value={albumVideoThumb}
                  onChange={(e) => setAlbumVideoThumb(e.target.value)}
                  placeholder="Thumbnail URL (optional)"
                  className="max-md:h-11"
                />
                <Input
                  value={albumVideoCaption}
                  onChange={(e) => setAlbumVideoCaption(e.target.value)}
                  placeholder="Title / caption (optional)"
                  className="max-md:h-11"
                />
                <Button type="button" variant="secondary" onClick={handleAddAlbumYoutubeVideo} className="max-md:h-11">
                  {editingAlbum ? 'Add video to album' : 'Queue video for new album'}
                </Button>
              </div>
              {isMediaUploading && (
                <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Uploading images...
                    </span>
                    <span className="font-medium">{mediaUploadProgress}%</span>
                  </div>
                  <Progress value={mediaUploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="max-md:flex-col max-md:items-stretch max-md:gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="max-md:w-full">
              Cancel
            </Button>
            {isDirty && (
              <span className="text-xs text-amber-500 flex items-center gap-1 max-md:justify-center">
                ● Unsaved changes
              </span>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="max-md:w-full max-md:h-11">
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
