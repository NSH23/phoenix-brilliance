import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, MoreHorizontal, Calendar, Loader2, Eye, EyeOff, Image, Star } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { optimizeMediaUrl } from '@/lib/mediaDelivery';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAdminAlbumsPage,
  updateAlbum,
  deleteAlbum,
  getAllAlbumMediaCounts,
  type Album,
} from '@/services/albums';
import { getAllEvents, type Event } from '@/services/events';
import { toast } from 'sonner';
import { adminCardMenuTriggerClass } from '@/components/admin/adminStyles';

const PAGE_SIZE = 12;

interface AlbumWithMeta extends Album {
  mediaCount?: number;
  eventTitle?: string;
}

export default function AdminAlbums() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [albums, setAlbums] = useState<AlbumWithMeta[]>([]);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');

  const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const currentQuery = (searchParams.get('q') || '').trim();
  const currentEvent = searchParams.get('event') || 'all';

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [result, counts, eventList] = await Promise.all([
        getAdminAlbumsPage({
          page: currentPage - 1,
          pageSize: PAGE_SIZE,
          searchQuery: currentQuery,
          eventId: currentEvent,
        }),
        getAllAlbumMediaCounts(),
        getAllEvents(),
      ]);
      setEvents(eventList);
      setAlbums(
        result.data.map((a) => ({
          ...a,
          mediaCount: counts[a.id] ?? 0,
          eventTitle: (a as Album & { events?: { title?: string } }).events?.title,
        }))
      );
      setTotalAlbums(result.total);
    } catch (err: unknown) {
      logger.error('Failed to load albums', err, { component: 'AdminAlbums' });
      toast.error('Failed to load albums', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentQuery, currentEvent]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSearchQuery(currentQuery);
    setFilterEvent(currentEvent);
  }, [currentQuery, currentEvent]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      navigate('/admin/albums/new/edit');
    }
  }, [searchParams, setSearchParams, navigate]);

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

  const handleToggleActive = async (album: AlbumWithMeta, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await updateAlbum(album.id, { is_active: !album.is_active });
      setAlbums((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
      toast.success(updated.is_active ? 'Visible on website' : 'Hidden from website');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this album?')) return;
    try {
      await deleteAlbum(id);
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      toast.success('Album deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const openEdit = (album: AlbumWithMeta) => {
    navigate(`/admin/albums/${album.id}/edit`);
  };

  const renderAlbumCard = (album: AlbumWithMeta) => (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => openEdit(album)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEdit(album);
        }
      }}
    >
      <div className="relative aspect-[16/10] bg-muted">
        {album.cover_image ? (
          <img src={optimizeMediaUrl(album.cover_image, { preset: 'card' })} alt={album.title} className="h-full w-full object-contain bg-muted/25 p-1" loading="lazy" decoding="async" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        {album.is_featured ? (
          <Badge className="absolute left-2 top-2 gap-1 bg-primary/90">
            <Star className="h-3 w-3" /> Featured
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-base font-bold">{album.title}</h3>
            <p className="truncate text-xs text-muted-foreground">{album.eventTitle || '—'}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={adminCardMenuTriggerClass} onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(album)}>Edit album</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => void handleDelete(album.id, e as unknown as React.MouseEvent)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Image className="h-3.5 w-3.5" />
            {album.mediaCount ?? 0} items
          </span>
          {album.event_date ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(album.event_date).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {album.is_active !== false ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
          {album.is_active !== false ? 'Visible' : 'Hidden'}
        </span>
        <Switch
          checked={album.is_active !== false}
          onCheckedChange={() => void handleToggleActive(album)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Card>
  );

  return (
    <AdminLayout title="Albums" subtitle="Manage event albums and gallery folders">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => {
              const v = e.target.value;
              setSearchQuery(v);
              updateQueryParams({ q: v, page: 1 });
            }}
            className="max-md:h-11 pl-10"
          />
        </div>
        <Select
          value={filterEvent}
          onValueChange={(v) => {
            setFilterEvent(v);
            updateQueryParams({ event: v, page: 1 });
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {events.map((ev) => (
              <SelectItem key={ev.id} value={ev.id}>
                {ev.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="gap-2 max-md:h-11" asChild>
          <Link to="/admin/albums/new/edit">
            <Plus className="h-4 w-4" />
            Add Album
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`sk-${i}`} className="h-56 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No albums found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album, i) => (
            <motion.div key={album.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              {renderAlbumCard(album)}
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" disabled={currentPage <= 1} onClick={() => updateQueryParams({ page: currentPage - 1 })}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => updateQueryParams({ page: currentPage + 1 })}>
            Next
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
