import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
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
  getAllBeforeAfter,
  createBeforeAfter,
  updateBeforeAfter,
  deleteBeforeAfter,
  type BeforeAfter,
} from '@/services/beforeAfter';
import { toast } from 'sonner';

const MAX_BEFORE_AFTER_CARDS = 4;

export default function AdminBeforeAfter() {
  const [items, setItems] = useState<BeforeAfter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BeforeAfter | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    before_image_url: '',
    after_image_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await getAllBeforeAfter();
      setItems(data);
    } catch (err: unknown) {
      logger.error('Failed to load before/after items', err, { component: 'AdminBeforeAfter', action: 'loadItems' });
      toast.error('Failed to load', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (item?: BeforeAfter) => {
    if (!item && items.length >= MAX_BEFORE_AFTER_CARDS) {
      toast.error(`Maximum ${MAX_BEFORE_AFTER_CARDS} cards allowed. Delete one to add a new card.`);
      return;
    }
    const nextOrder = items.length > 0
      ? Math.max(...items.map((i) => i.display_order)) + 1
      : 0;
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        before_image_url: item.before_image_url,
        after_image_url: item.after_image_url,
        display_order: item.display_order,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        before_image_url: '',
        after_image_url: '',
        display_order: nextOrder,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.before_image_url?.trim()) {
      toast.error('Before image is required');
      return;
    }
    if (!formData.after_image_url?.trim()) {
      toast.error('After image is required');
      return;
    }
    try {
      setIsSaving(true);
      if (editingItem) {
        const updated = await updateBeforeAfter(editingItem.id, formData);
        setItems(items.map((i) => (i.id === editingItem.id ? updated : i)));
        toast.success('Updated successfully');
      } else {
        const created = await createBeforeAfter(formData);
        setItems([...items, created]);
        toast.success('Created successfully');
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteBeforeAfter(id);
      setItems(items.filter((i) => i.id !== id));
      toast.success('Deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const handleToggleActive = async (item: BeforeAfter) => {
    try {
      const updated = await updateBeforeAfter(item.id, { is_active: !item.is_active });
      setItems(items.map((i) => (i.id === item.id ? updated : i)));
      toast.success(updated.is_active ? 'Activated' : 'Deactivated');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  return (
    <AdminLayout title="Before & After" subtitle="Manage homepage before/after comparison cards">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {items.length} / {MAX_BEFORE_AFTER_CARDS} cards (max)
        </p>
        <Button
          onClick={() => handleOpenDialog()}
          className="gap-2"
          disabled={items.length >= MAX_BEFORE_AFTER_CARDS}
        >
          <Plus className="w-4 h-4" />
          Add Before & After
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-4">No before/after cards yet. Add up to {MAX_BEFORE_AFTER_CARDS} cards.</p>
          <Button onClick={() => handleOpenDialog()}>Add your first card</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={item.after_image_url || '/placeholder.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                          {item.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description || '—'}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">Order: {item.display_order}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Before & After</DialogTitle>
            <DialogDescription>
              Add before and after images for the homepage comparison slider. Drag the slider to compare.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Acne Treatment Series"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., 6-month acne treatment program with chemical peels and LED therapy"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Before Image *</Label>
              <ImageUpload
                value={formData.before_image_url}
                onChange={(v) => setFormData({ ...formData, before_image_url: v as string })}
                multiple={false}
                bucket="before-after-images"
                uploadOnSelect
                previewClassName="object-cover"
              />
            </div>
            <div className="grid gap-2">
              <Label>After Image *</Label>
              <ImageUpload
                value={formData.after_image_url}
                onChange={(v) => setFormData({ ...formData, after_image_url: v as string })}
                multiple={false}
                bucket="before-after-images"
                uploadOnSelect
                previewClassName="object-cover"
              />
            </div>
            <div className="grid gap-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
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
                editingItem ? 'Save' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
