import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, MapPin, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { logger } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  getAllCollaborations,
  getCollaborationById,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
  getCollaborationImages,
  createCollaborationImage,
  deleteCollaborationImage,
  type Collaboration,
} from '@/services/collaborations';
import { toast } from 'sonner';

export default function AdminCollaborations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    description: '',
    location: '',
    mapUrl: '',
    isActive: true,
    display_order: 0,
  });
  const [venueImages, setVenueImages] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllCollaborations();
      setCollaborations(data);
    } catch (err: unknown) {
      logger.error('Failed to load collaborations', err, { component: 'AdminCollaborations', action: 'loadCollaborations' });
      toast.error('Failed to load collaborations', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      handleOpenDialog();
    }
  }, [searchParams.get('add')]);

  const filteredCollaborations = collaborations.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = async (collab?: Collaboration) => {
    const nextOrder = collaborations.length > 0
      ? Math.max(...collaborations.map(c => c.display_order ?? 0)) + 1
      : 0;
    if (collab) {
      setEditingCollab(collab);
      setFormData({
        name: collab.name,
        logoUrl: collab.logo_url || '',
        description: collab.description || '',
        location: collab.location || '',
        mapUrl: collab.map_url || '',
        isActive: collab.is_active ?? true,
        display_order: collab.display_order ?? 0,
      });
      try {
        const full = await getCollaborationById(collab.id) as { collaboration_images?: { image_url: string }[] };
        setVenueImages((full?.collaboration_images || []).map(img => img.image_url));
      } catch {
        setVenueImages([]);
      }
    } else {
      setEditingCollab(null);
      setFormData({
        name: '',
        logoUrl: '',
        description: '',
        location: '',
        mapUrl: '',
        isActive: true,
        display_order: nextOrder,
      });
      setVenueImages([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Partner name is required');
      return;
    }
    setSaving(true);
    try {
      const base = {
        name: formData.name.trim(),
        logo_url: formData.logoUrl.trim() || null,
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        map_url: formData.mapUrl.trim() || null,
        is_active: formData.isActive,
        display_order: formData.display_order,
      };

      if (editingCollab) {
        const updated = await updateCollaboration(editingCollab.id, base);
        setCollaborations(prev => prev.map(c => (c.id === updated.id ? updated : c)));

        const existing = await getCollaborationImages(editingCollab.id);
        for (const img of existing) await deleteCollaborationImage(img.id);
        for (let i = 0; i < venueImages.length; i++) {
          await createCollaborationImage({
            collaboration_id: editingCollab.id,
            image_url: venueImages[i],
            caption: null,
            display_order: i,
          });
        }
        toast.success('Collaboration updated');
      } else {
        const created = await createCollaboration(base);
        for (let i = 0; i < venueImages.length; i++) {
          await createCollaborationImage({
            collaboration_id: created.id,
            image_url: venueImages[i],
            caption: null,
            display_order: i,
          });
        }
        setCollaborations(prev => [created, ...prev]);
        toast.success('Collaboration created');
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collaboration?')) return;
    try {
      await deleteCollaboration(id);
      setCollaborations(prev => prev.filter(c => c.id !== id));
      toast.success('Collaboration deleted');
      if (editingCollab?.id === id) setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const handleToggleActive = async (c: Collaboration) => {
    try {
      const updated = await updateCollaboration(c.id, { is_active: !c.is_active });
      setCollaborations(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_active ? 'Marked active' : 'Marked inactive');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  return (
    <AdminLayout title="Collaborations" subtitle="Manage your venue partners and collaborators">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search collaborations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Partner
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollaborations.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-sm">
                            {c.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold">{c.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {c.location || '—'}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(c)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {c.description || '—'}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Order: {c.display_order ?? 0}</span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        c.is_active
                          ? 'bg-primary/10 text-primary ring-primary/20'
                          : 'bg-muted text-muted-foreground ring-border'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-3 bg-muted/50 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={() => handleToggleActive(c)}
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredCollaborations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No collaborations found.</div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollab ? 'Edit Collaboration' : 'Add New Partner'}</DialogTitle>
            <DialogDescription>
              {editingCollab ? 'Update the partner details. Changes are saved to the database.' : 'Add a new venue partner. It will be saved to the database.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Partner Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Grand Hyatt, Taj Hotels"
              />
            </div>
            <div className="grid gap-2">
              <Label>Partner Logo</Label>
              <ImageUpload
                value={formData.logoUrl}
                onChange={v => setFormData({ ...formData, logoUrl: (v as string) || '' })}
                multiple={false}
                previewClassName="object-contain"
                bucket="partner-logos"
                uploadOnSelect={true}
              />
              <p className="text-xs text-muted-foreground">Or paste image URL:</p>
              <Input
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the venue/partner..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Mumbai, Maharashtra"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mapUrl">Google Maps URL</Label>
              <Input
                id="mapUrl"
                value={formData.mapUrl}
                onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
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
              <p className="text-xs text-muted-foreground">
                Auto-filled as next (e.g. 0→1, 1→2) when adding. Lower numbers appear first. You can change it.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Venue Images</Label>
              <ImageUpload
                value={venueImages}
                onChange={v => setVenueImages((v as string[]) || [])}
                multiple
                maxFiles={20}
                previewClassName="object-cover"
                bucket="gallery-images"
                uploadOnSelect={true}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active (visible on website)</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={v => setFormData({ ...formData, isActive: v })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving... </> : (editingCollab ? 'Save Changes' : 'Create Partner')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
