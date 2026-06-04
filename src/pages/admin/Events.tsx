import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminSortableGrid, AdminSortableItem } from '@/components/admin/AdminSortableGrid';
import { logger } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
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
import { getAdminEventsPage, updateEvent, deleteEvent, type Event } from '@/services/events';
import { toast } from 'sonner';
import { adminCardMenuTriggerOverlayClass } from '@/components/admin/adminStyles';

const PAGE_SIZE = 12;

export default function AdminEvents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const currentQuery = (searchParams.get('q') || '').trim();

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getAdminEventsPage({
        page: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchQuery: currentQuery,
      });
      setEvents(result.data);
      setTotalEvents(result.total);
    } catch (err: unknown) {
      logger.error('Failed to load events', err, { component: 'AdminEvents' });
      toast.error('Failed to load events', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      navigate('/admin/events/new/edit');
    }
  }, [searchParams, setSearchParams, navigate]);

  const updateQueryParams = (next: { page?: number; q?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (next.q !== undefined) {
      if (next.q.trim()) params.set('q', next.q.trim());
      else params.delete('q');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    setSearchParams(params, { replace: true });
  };

  const showReorder = !currentQuery && currentPage === 1 && totalEvents <= PAGE_SIZE;
  const listForCards = showReorder
    ? [...events].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : events;
  const totalPages = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE));

  const persistEventOrder = async (orderedIds: string[]) => {
    setIsReordering(true);
    try {
      await Promise.all(orderedIds.map((id, i) => updateEvent(id, { display_order: i })));
      setEvents((prev) => {
        const byId = new Map(prev.map((e) => [e.id, e]));
        return orderedIds.map((id, i) => ({ ...byId.get(id)!, display_order: i }));
      });
      toast.success('Display order saved');
    } catch (err: unknown) {
      toast.error('Failed to save order', { description: (err as Error)?.message });
      void load();
    } finally {
      setIsReordering(false);
    }
  };

  const handleToggleActive = async (event: Event, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await updateEvent(event.id, { is_active: !event.is_active });
      setEvents((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_active ? 'Published' : 'Unpublished');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Event deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const openEdit = (event: Event) => navigate(`/admin/events/${event.id}/edit`);

  const renderEventCard = (event: Event) => (
    <Card
      className="group flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => openEdit(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEdit(event);
        }
      }}
    >
      <div className="relative h-40 overflow-hidden bg-muted md:h-48">
        <img
          src={event.cover_image || '/placeholder.svg'}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <Badge
          className="absolute left-3 top-3"
          variant={event.is_active ? 'default' : 'secondary'}
        >
          {event.is_active ? 'Active' : 'Inactive'}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={adminCardMenuTriggerOverlayClass}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(event)}>Edit event</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/events/${event.slug}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={(e) => void handleDelete(event.id, e as unknown as React.MouseEvent)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="line-clamp-2 font-serif text-lg font-bold text-white drop-shadow md:text-xl">{event.title}</h3>
          <p className="truncate font-mono text-xs text-white/80">/events/{event.slug}</p>
        </div>
      </div>
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {event.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
          Order {event.display_order ?? 0}
        </span>
        <Switch checked={event.is_active} onCheckedChange={() => void handleToggleActive(event)} onClick={(e) => e.stopPropagation()} />
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Events" subtitle="Manage event types — click a card to open the full editor">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => {
              const v = e.target.value;
              setSearchQuery(v);
              updateQueryParams({ q: v, page: 1 });
            }}
            className="pl-10 max-md:h-11"
          />
        </div>
        <Button className="gap-2 max-md:h-11" asChild>
          <Link to="/admin/events/new/edit">
            <Plus className="h-4 w-4" />
            Add event
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`sk-${i}`} className="h-56 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No events found.</div>
      ) : (
        <>
          {showReorder && events.length >= 2 ? (
            <p className="mb-2 text-xs text-muted-foreground">Drag to reorder homepage display.</p>
          ) : null}
          {showReorder ? (
            <AdminSortableGrid
              itemIds={listForCards.map((e) => e.id)}
              disabled={isReordering}
              onReorder={persistEventOrder}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {listForCards.map((event, i) => (
                <AdminSortableItem key={event.id} id={event.id} disabled={isReordering}>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    {renderEventCard(event)}
                  </motion.div>
                </AdminSortableItem>
              ))}
            </AdminSortableGrid>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listForCards.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {renderEventCard(event)}
                </motion.div>
              ))}
            </div>
          )}
        </>
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
