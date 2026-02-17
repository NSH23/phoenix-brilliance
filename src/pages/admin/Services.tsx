import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, GripVertical, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  type Service,
} from '@/services/services';
import { toast } from 'sonner';

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    image_url: '',
    features: '',
    isActive: true,
    display_order: 0,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await getAllServices();
      setServices(data);
    } catch (err: unknown) {
      logger.error('Failed to load services', err, { component: 'AdminServices', action: 'loadServices' });
      toast.error('Failed to load services', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (service?: Service) => {
    const nextOrder = services.length > 0
      ? Math.max(...services.map(s => s.display_order ?? 0)) + 1
      : 0;
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        description: service.description || '',
        icon: service.icon || '',
        image_url: service.image_url || '',
        features: (service.features || []).join(', '),
        isActive: service.is_active ?? true,
        display_order: service.display_order ?? 0,
      });
    } else {
      setEditingService(null);
      setFormData({
        title: '',
        description: '',
        icon: '',
        image_url: '',
        features: '',
        isActive: true,
        display_order: nextOrder,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const featuresArray = formData.features.split(',').map(f => f.trim()).filter(Boolean);
    setSaving(true);
    try {
      if (editingService) {
        const updated = await updateService(editingService.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon.trim() || null,
          image_url: formData.image_url || null,
          features: featuresArray,
          is_active: formData.isActive,
          display_order: formData.display_order,
        });
        setServices(prev => prev.map(s => (s.id === updated.id ? updated : s)));
        toast.success('Service updated');
      } else {
        const created = await createService({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon.trim() || null,
          image_url: formData.image_url || null,
          features: featuresArray,
          is_active: formData.isActive,
          display_order: formData.display_order,
        });
        setServices(prev => [created, ...prev]);
        toast.success('Service created');
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service deleted');
      if (editingService?.id === id) setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const handleToggleActive = async (s: Service) => {
    try {
      const updated = await updateService(s.id, { is_active: !s.is_active });
      setServices(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_active ? 'Marked active' : 'Marked inactive');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  return (
    <AdminLayout title="Services" subtitle="Manage your service offerings">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-5 h-5" />
                      {s.image_url && (
                        <img
                          src={s.image_url}
                          alt={s.title}
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-serif font-bold">{s.title}</h3>
                        <Badge variant={s.is_active ? 'default' : 'secondary'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">Order: {s.display_order ?? 0}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {s.description || '—'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(s.features || []).map((f, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={s.is_active}
                          onCheckedChange={() => handleToggleActive(s)}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(s)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredServices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No services found.</div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Update the service details below.' : 'Create a new service offering. Saved to the database.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Service Image</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url as string })}
                bucket="service-images"
                previewClassName="aspect-video w-full object-cover"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Event Planning"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon Name (Lucide)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., Calendar, Camera, Music, Palette, Sparkles"
              />
              <p className="text-xs text-muted-foreground">PascalCase: CalendarCheck, UtensilsCrossed, etc.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                value={formData.features}
                onChange={e => setFormData({ ...formData, features: e.target.value })}
                placeholder="e.g., Venue Selection, Budget Management, Timeline Planning"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={formData.display_order}
                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Auto-filled as next when adding. Lower numbers appear first.</p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={v => setFormData({ ...formData, isActive: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (editingService ? 'Save Changes' : 'Create Service')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
