import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, MoreHorizontal, MapPin, Loader2, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminSortableGrid, AdminSortableItem } from '@/components/admin/AdminSortableGrid';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getAdminCollaborationsPage,
  updateCollaboration,
  deleteCollaboration,
  type Collaboration,
} from '@/services/collaborations';
import { resolvePublicStorageUrl } from '@/services/storage';
import { toast } from 'sonner';
import { adminCardMenuTriggerClass } from '@/components/admin/adminStyles';

const PAGE_SIZE = 12;

function resolveLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return resolvePublicStorageUrl(url, 'partner-logos');
}

export default function AdminCollaborations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [totalCollaborations, setTotalCollaborations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  const currentPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const currentQuery = (searchParams.get('q') || '').trim();

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getAdminCollaborationsPage({
        page: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchQuery: currentQuery,
      });
      setCollaborations(result.data);
      setTotalCollaborations(result.total);
    } catch (err: unknown) {
      logger.error('Failed to load collaborations', err, { component: 'AdminCollaborations' });
      toast.error('Failed to load venues', { description: (err as Error)?.message });
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
      navigate('/admin/collaborations/new/edit');
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

  const showReorder = !currentQuery && currentPage === 1 && totalCollaborations <= PAGE_SIZE;
  const listForCards = showReorder
    ? [...collaborations].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : collaborations;
  const totalPages = Math.max(1, Math.ceil(totalCollaborations / PAGE_SIZE));

  const persistCollaborationOrder = async (orderedIds: string[]) => {
    setIsReordering(true);
    try {
      await Promise.all(orderedIds.map((id, i) => updateCollaboration(id, { display_order: i })));
      setCollaborations((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]));
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

  const handleToggleActive = async (c: Collaboration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await updateCollaboration(c.id, { is_active: !c.is_active });
      setCollaborations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_active ? 'Visible on website' : 'Hidden from website');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this venue?')) return;
    try {
      await deleteCollaboration(id);
      setCollaborations((prev) => prev.filter((c) => c.id !== id));
      toast.success('Venue deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const openEdit = (c: Collaboration) => {
    navigate(`/admin/collaborations/${c.id}/edit`);
  };

  const renderVenueCard = (c: Collaboration) => (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => openEdit(c)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEdit(c);
        }
      }}
    >
      <div className="flex flex-1 p-4 md:p-6">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted md:h-12 md:w-12">
              {c.logo_url ? (
                <img src={resolveLogoUrl(c.logo_url)!} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                  {c.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-serif text-base font-bold">{c.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{c.location || '—'}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={adminCardMenuTriggerClass} onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(c)}>Edit venue</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => void handleDelete(c.id, e as unknown as React.MouseEvent)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 md:px-6">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {c.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
          {c.is_active ? 'Visible' : 'Hidden'}
        </span>
        <Switch checked={c.is_active} onCheckedChange={() => void handleToggleActive(c)} onClick={(e) => e.stopPropagation()} />
      </div>
    </Card>
  );

  return (
    <AdminLayout title="Venues" subtitle="Manage venue partners and gallery folders">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
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
          <Link to="/admin/collaborations/new/edit">
            <Plus className="h-4 w-4" />
            Add Venue
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={`sk-${i}`} className="h-32 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : collaborations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No venues found.</div>
      ) : (
        <>
          {collaborations.length >= 2 && showReorder ? (
            <p className="mb-2 text-xs text-muted-foreground">Drag the grip to reorder venues on the website.</p>
          ) : null}
          {showReorder ? (
            <AdminSortableGrid
              itemIds={listForCards.map((c) => c.id)}
              disabled={isReordering}
              onReorder={persistCollaborationOrder}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {listForCards.map((c, i) => (
                <AdminSortableItem key={c.id} id={c.id} disabled={isReordering}>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    {renderVenueCard(c)}
                  </motion.div>
                </AdminSortableItem>
              ))}
            </AdminSortableGrid>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listForCards.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {renderVenueCard(c)}
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
