import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, MoreHorizontal, Eye, EyeOff, ImageIcon, Loader2 } from 'lucide-react';
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
import { getAllServices, updateService, deleteService, type Service } from '@/services/services';
import { resolvePublicStorageUrl } from '@/services/storage';
import { optimizeMediaUrl } from '@/lib/mediaDelivery';
import { toast } from 'sonner';
import { adminCardMenuTriggerClass } from '@/components/admin/adminStyles';

export default function AdminServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await getAllServices();
      setServices(data);
    } catch (err: unknown) {
      logger.error('Failed to load services', err, { component: 'AdminServices' });
      toast.error('Failed to load services', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showReorder = !searchQuery.trim();
  const listForCards = showReorder
    ? [...services].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : filteredServices;

  const persistServiceOrder = async (orderedIds: string[]) => {
    setIsReordering(true);
    try {
      await Promise.all(orderedIds.map((id, i) => updateService(id, { display_order: i })));
      setServices((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
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

  const handleToggleActive = async (s: Service, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await updateService(s.id, { is_active: !s.is_active });
      setServices((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_active ? 'Active' : 'Inactive');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success('Service deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const openEdit = (s: Service) => navigate(`/admin/services/${s.id}/edit`);

  const renderServiceCard = (s: Service) => (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => openEdit(s)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEdit(s);
        }
      }}
    >
      <div className="relative aspect-[16/10] bg-muted">
        {s.image_url ? (
          <img
            src={optimizeMediaUrl(resolvePublicStorageUrl(s.image_url, 'service-images'), { preset: 'card' })}
            alt={s.title}
            className="h-full w-full object-contain bg-muted/25 p-1"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <Badge className="absolute left-2 top-2" variant={s.is_active ? 'default' : 'secondary'}>
          {s.is_active ? 'Active' : 'Hidden'}
        </Badge>
      </div>
      <CardContent className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-base font-bold">{s.title}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">{s.description || '—'}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={adminCardMenuTriggerClass} onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(s)}>Edit service</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => void handleDelete(s.id, e as unknown as React.MouseEvent)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-1">
          {(s.features || []).slice(0, 2).map((f, j) => (
            <Badge key={j} variant="outline" className="text-[10px]">
              {f}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {s.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5" />}
            Order {s.display_order ?? 0}
          </span>
          <Switch checked={s.is_active} onCheckedChange={() => void handleToggleActive(s)} onClick={(e) => e.stopPropagation()} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Services" subtitle="Click a card to open the full editor">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-md:h-11"
          />
        </div>
        <Button className="gap-2 max-md:h-11" asChild>
          <Link to="/admin/services/new/edit">
            <Plus className="h-4 w-4" />
            Add service
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listForCards.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No services found.</div>
      ) : (
        <>
          {showReorder && services.length >= 2 ? (
            <p className="mb-2 text-xs text-muted-foreground">Drag to reorder on the website.</p>
          ) : null}
          {showReorder ? (
            <AdminSortableGrid
              itemIds={listForCards.map((s) => s.id)}
              disabled={isReordering}
              onReorder={persistServiceOrder}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {listForCards.map((s, i) => (
                <AdminSortableItem key={s.id} id={s.id} disabled={isReordering}>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    {renderServiceCard(s)}
                  </motion.div>
                </AdminSortableItem>
              ))}
            </AdminSortableGrid>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listForCards.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {renderServiceCard(s)}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
