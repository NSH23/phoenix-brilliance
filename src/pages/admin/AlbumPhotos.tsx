import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminFormSection from '@/components/admin/AdminFormSection';
import AdminAlbumPhotoGrid from '@/components/admin/AdminAlbumPhotoGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  adminPanelClass,
  adminRecordEditLayoutClass,
  adminRecordEditPreviewAsideClass,
} from '@/components/admin/adminStyles';
import { useAdminAlbumPhotos } from '@/hooks/useAdminAlbumPhotos';
import { getAlbumForAdminEdit, type Album } from '@/services/albums';
import { getAllEvents, type Event } from '@/services/events';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

export default function AlbumPhotosPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const albumId = id ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [album, setAlbum] = useState<Album | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  const {
    photos,
    autosavePhotos,
    initFromMedia,
    persistPhotos,
    handlePhotosChange,
    toggleAutosavePhotos,
  } = useAdminAlbumPhotos(albumId);

  const loadAlbum = useCallback(
    async (targetId: string) => {
      setLoading(true);
      try {
        const full = await getAlbumForAdminEdit(targetId);
        setAlbum(full);
        initFromMedia(full.album_media || []);
      } catch (err) {
        logger.error('Failed to load album photos', err, { component: 'AlbumPhotosPage' });
        toast.error('Failed to load album');
        navigate('/admin/albums');
      } finally {
        setLoading(false);
      }
    },
    [initFromMedia, navigate]
  );

  useEffect(() => {
    void getAllEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (!albumId) {
      navigate('/admin/albums');
      return;
    }
    void loadAlbum(albumId);
  }, [albumId, loadAlbum, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistPhotos(photos, { force: true });
    } catch {
      // persistPhotos shows toast
    } finally {
      setSaving(false);
    }
  };

  const eventTitle = events.find((e) => e.id === album?.event_id)?.title;
  const editHref = albumId ? `/admin/albums/${albumId}/edit` : '/admin/albums';

  if (loading) {
    return (
      <AdminLayout title="Loading…" subtitle="">
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!album) return null;

  return (
    <AdminLayout
      title={album.title}
      subtitle="Upload and manage album photos"
      headerBack={
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground" asChild>
          <Link to={editHref}>
            <ArrowLeft className="h-4 w-4" />
            Album details
          </Link>
        </Button>
      }
      headerActions={
        <Button size="sm" className="h-10 gap-1.5 max-md:px-3 md:h-9" disabled={saving} onClick={() => void handleSave()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="hidden sm:inline">Save photos</span>
          <span className="sm:hidden">Save</span>
        </Button>
      }
    >
      <div className={adminRecordEditLayoutClass}>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Autosave photos</p>
              <p className="text-xs text-muted-foreground">
                {autosavePhotos
                  ? 'Uploads and edits save automatically.'
                  : 'Changes stay local until you tap Save photos.'}
              </p>
            </div>
            <Switch checked={autosavePhotos} onCheckedChange={toggleAutosavePhotos} aria-label="Autosave photos" />
          </div>

          <AdminFormSection
            title="Photos"
            description="Upload images, drag to reorder, or use copy, cut, paste, and delete."
          >
            <AdminAlbumPhotoGrid
              photos={photos}
              onChange={handlePhotosChange}
              autosaveEnabled={autosavePhotos}
              onPersist={(next) => persistPhotos(next, { silent: true, force: true })}
            />
          </AdminFormSection>
        </div>

        <aside className={cn(adminRecordEditPreviewAsideClass, 'space-y-3')}>
          <div className={cn(adminPanelClass, 'overflow-hidden')}>
            <div className="relative aspect-video bg-muted">
              {album.cover_image ? (
                <img src={album.cover_image} alt="" className="h-full w-full object-contain bg-muted/25 p-2" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cover</div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <p className="font-semibold">{album.title}</p>
              {eventTitle ? <p className="text-xs text-muted-foreground">{eventTitle}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Badge variant={album.is_active ? 'default' : 'secondary'}>
                  {album.is_active ? 'Published' : 'Draft'}
                </Badge>
                {album.is_featured ? <Badge variant="outline">Featured</Badge> : null}
                <Badge variant="outline">{photos.length} photos</Badge>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={editHref}>Edit album details</Link>
          </Button>
        </aside>
      </div>
    </AdminLayout>
  );
}
