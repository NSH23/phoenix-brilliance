import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, MapPin, Loader2, FolderPlus, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
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
  updateCollaborationImage,
  deleteCollaborationImage,
  getCollaborationFolders,
  updateCollaborationFolder,
  seedCollaborationFolders,
  type Collaboration,
  type CollaborationFolder,
} from '@/services/collaborations';
import { getPublicUrl } from '@/services/storage';
import { toast } from 'sonner';

function resolveLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return getPublicUrl('partner-logos', url);
}

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
    bannerUrl: '',
    description: '',
    location: '',
    mapUrl: '',
    isActive: true,
    display_order: 0,
  });
  const [venueImages, setVenueImages] = useState<string[]>([]);
  const [galleryFolders, setGalleryFolders] = useState<Array<{ id: string; collaboration_id?: string; parent_id: string | null; name: string; display_order: number; is_enabled: boolean }>>([]);
  const [galleryImages, setGalleryImages] = useState<Array<{ id?: string; image_url: string; folder_id: string | null; display_order: number }>>([]);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

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
        bannerUrl: collab.banner_url || '',
        description: collab.description || '',
        location: collab.location || '',
        mapUrl: collab.map_url || '',
        isActive: collab.is_active ?? true,
        display_order: collab.display_order ?? 0,
      });
      try {
        const full = await getCollaborationById(collab.id) as {
          collaboration_images?: Array<{ id: string; image_url: string; folder_id: string | null; display_order: number }>;
          collaboration_folders?: CollaborationFolder[];
        };
        const imgs = full?.collaboration_images || [];
        setVenueImages([]); // Venue images only used when creating; when editing we use gallery folders/images
        setGalleryImages(imgs.map((img, i) => ({
          id: img.id,
          image_url: img.image_url,
          folder_id: img.folder_id ?? null,
          display_order: img.display_order ?? i,
        })));
        const folders = full?.collaboration_folders || [];
        setGalleryFolders(folders.map(f => ({
          id: f.id,
          collaboration_id: f.collaboration_id,
          parent_id: f.parent_id,
          name: f.name,
          display_order: f.display_order,
          is_enabled: f.is_enabled ?? false,
        })));
        // Expand all root folders by default so folder/subfolder structure is visible
        const rootIds = folders.filter(f => !f.parent_id).map(f => f.id);
        setExpandedFolderIds(new Set(rootIds));
      } catch {
        setVenueImages([]);
        setGalleryImages([]);
        setGalleryFolders([]);
      }
    } else {
      setEditingCollab(null);
      setFormData({
        name: '',
        logoUrl: '',
        bannerUrl: '',
        description: '',
        location: '',
        mapUrl: '',
        isActive: true,
        display_order: nextOrder,
      });
      setVenueImages([]);
      setGalleryImages([]);
      setGalleryFolders([]);
      setExpandedFolderIds(new Set());
    }
    setSelectedFolderId(null);
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
        banner_url: formData.bannerUrl.trim() || null,
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        map_url: formData.mapUrl.trim() || null,
        is_active: formData.isActive,
        display_order: formData.display_order,
      };

      if (editingCollab) {
        const updated = await updateCollaboration(editingCollab.id, base);
        setCollaborations(prev => prev.map(c => (c.id === updated.id ? updated : c)));

        const collabId = editingCollab.id;

        for (const folder of galleryFolders) {
          await updateCollaborationFolder(folder.id, {
            name: folder.name,
            display_order: folder.display_order,
            is_enabled: folder.is_enabled,
          });
        }

        const validFolderIds = new Set(galleryFolders.map(f => f.id));
        const resolveFolderId = (id: string | null): string | null => {
          if (!id) return null;
          return validFolderIds.has(id) ? id : null;
        };
        const existingImages = await getCollaborationImages(collabId);
        const existingIds = new Set(existingImages.map(i => i.id));
        const currentImageIds = new Set(galleryImages.filter(i => i.id).map(i => i.id));

        for (const img of galleryImages) {
          const folderId = resolveFolderId(img.folder_id);
          if (img.id && existingIds.has(img.id)) {
            const existing = existingImages.find(e => e.id === img.id);
            if (existing?.folder_id !== folderId) {
              await updateCollaborationImage(img.id!, { folder_id: folderId });
            }
          } else if (!img.id) {
            await createCollaborationImage({
              collaboration_id: collabId,
              image_url: img.image_url,
              caption: null,
              display_order: img.display_order,
              folder_id: folderId,
              media_type: 'image',
            });
          }
        }
        for (const e of existingImages) {
          if (!currentImageIds.has(e.id)) await deleteCollaborationImage(e.id);
        }

        toast.success('Collaboration updated. Folders and images will appear on the public collaboration page.');
      } else {
        const created = await createCollaboration(base);
        for (let i = 0; i < venueImages.length; i++) {
          await createCollaborationImage({
            collaboration_id: created.id,
            image_url: venueImages[i],
            caption: null,
            display_order: i,
            folder_id: null,
            media_type: 'image',
          });
        }
        setCollaborations(prev => [created, ...prev]);
        toast.success('Collaboration created');
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof (err as { message?: string })?.message === 'string' ? (err as { message: string }).message : String(err);
      toast.error('Save failed', { description: message, duration: 8000 });
      console.error('Collaboration save error:', err);
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

  const updateFolder = (id: string, updates: { name?: string; display_order?: number; is_enabled?: boolean }) => {
    setGalleryFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const toggleFolderEnabled = (id: string) => {
    setGalleryFolders(prev => prev.map(f => f.id === id ? { ...f, is_enabled: !f.is_enabled } : f));
  };

  const handleSeedFolders = async () => {
    if (!editingCollab) return;
    try {
      await seedCollaborationFolders(editingCollab.id);
      const folders = await getCollaborationFolders(editingCollab.id);
      setGalleryFolders(folders.map(f => ({
        id: f.id,
        collaboration_id: f.collaboration_id,
        parent_id: f.parent_id,
        name: f.name,
        display_order: f.display_order,
        is_enabled: f.is_enabled ?? false,
      })));
      const rootIds = folders.filter(f => !f.parent_id).map(f => f.id);
      setExpandedFolderIds(new Set(rootIds));
      toast.success('Standard folders created. Enable the ones you need and add images, then Save.');
    } catch (err: unknown) {
      toast.error('Failed to create folders', { description: (err as Error)?.message });
    }
  };

  const toggleFolderExpanded = (id: string) => {
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const imagesForFolder = (folderId: string | null) =>
    galleryImages.filter(img => (img.folder_id ?? null) === folderId);

  const setImagesForFolder = (folderId: string | null, urls: string[]) => {
    const existingInFolder = galleryImages.filter(img => (img.folder_id ?? null) === folderId);
    setGalleryImages(prev => {
      const others = prev.filter(img => (img.folder_id ?? null) !== folderId);
      const merged = urls.map((url, i) => {
        const found = existingInFolder.find(e => e.image_url === url);
        return found ? { ...found, display_order: i } : { image_url: url, folder_id: folderId, display_order: i };
      });
      return [...others, ...merged];
    });
  };

  const removeImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const setImageFolder = (index: number, folderId: string | null) => {
    setGalleryImages(prev => prev.map((img, i) => i === index ? { ...img, folder_id: folderId } : img));
  };

  const rootFolders = galleryFolders.filter(f => !f.parent_id).sort((a, b) => a.display_order - b.display_order);
  const getChildFolders = (parentId: string) =>
    galleryFolders.filter(f => f.parent_id === parentId).sort((a, b) => a.display_order - b.display_order);

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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {filteredCollaborations.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="p-3 md:p-6 flex-1">
                  <div className="flex items-start justify-between mb-2 md:mb-4">
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {c.logo_url ? (
                          <img src={resolveLogoUrl(c.logo_url)!} alt={c.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-xs md:text-sm">
                            {c.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-sm md:text-base truncate">{c.name}</h3>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.location || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 -mr-1 md:mr-0">
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
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 hidden md:block">
                    {c.description || '—'}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2 md:mt-0">
                    <span className="text-[10px] md:text-xs text-muted-foreground">Order: {c.display_order ?? 0}</span>
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-medium ring-1 ring-inset ${c.is_active
                          ? 'bg-primary/10 text-primary ring-primary/20'
                          : 'bg-muted text-muted-foreground ring-border'
                        }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-2 md:px-6 md:py-3 bg-muted/50 border-t flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-muted-foreground">Status</span>
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={() => handleToggleActive(c)}
                    className="h-4 w-8 md:h-6 md:w-11"
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
              <Label>Partner Banner</Label>
              <ImageUpload
                value={formData.bannerUrl}
                onChange={v => setFormData({ ...formData, bannerUrl: (v as string) || '' })}
                multiple={false}
                previewClassName="object-cover"
                bucket="gallery-images"
                uploadOnSelect={true}
              />
              <p className="text-xs text-muted-foreground">Hero/banner image for the venue page. Or paste URL:</p>
              <Input
                value={formData.bannerUrl}
                onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
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
            {!editingCollab && (
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
            )}
            {editingCollab && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-base font-semibold">Gallery</Label>
                  {rootFolders.length === 0 ? (
                    <Button type="button" variant="outline" size="sm" onClick={handleSeedFolders} className="gap-1">
                      <FolderPlus className="w-4 h-4" />
                      Create standard folders
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Turn on &quot;Show&quot; for folders you want on the site. Select a folder to add images.</span>
                  )}
                </div>
                {rootFolders.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No folders yet. Create standard event folders (Wedding, Birthday, etc.), then enable the ones you need.</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleSeedFolders} className="gap-1">
                      <FolderPlus className="w-4 h-4" />
                      Create standard folders
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
                    <div className="rounded-lg border bg-card overflow-hidden">
                      <div className="p-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">Folders</div>
                      <div className="max-h-[280px] overflow-y-auto">
                        {rootFolders.map((f) => (
                          <div key={f.id}>
                            <div
                              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md hover:bg-muted/70 ${selectedFolderId === f.id ? 'bg-primary/10' : ''}`}
                              onClick={() => setSelectedFolderId(f.id)}
                            >
                              <button type="button" onClick={(e) => { e.stopPropagation(); toggleFolderExpanded(f.id); }} className="p-0.5 shrink-0">
                                {expandedFolderIds.has(f.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm font-medium truncate flex-1">{f.name}</span>
                              <Switch checked={f.is_enabled} onCheckedChange={() => toggleFolderEnabled(f.id)} onClick={e => e.stopPropagation()} className="h-3.5 w-7 shrink-0" />
                            </div>
                            {expandedFolderIds.has(f.id) && getChildFolders(f.id).map((sub) => (
                              <div
                                key={sub.id}
                                className={`flex items-center gap-2 pl-8 pr-2 py-1.5 cursor-pointer rounded-md hover:bg-muted/70 ${selectedFolderId === sub.id ? 'bg-primary/10' : ''}`}
                                onClick={() => setSelectedFolderId(sub.id)}
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm truncate flex-1">{sub.name}</span>
                                <Switch checked={sub.is_enabled} onCheckedChange={() => toggleFolderEnabled(sub.id)} onClick={e => e.stopPropagation()} className="h-3.5 w-7 shrink-0" />
                              </div>
                            ))}
                          </div>
                        ))}
                        <div
                          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md hover:bg-muted/70 border-t mt-1 ${selectedFolderId === null ? 'bg-primary/10' : ''}`}
                          onClick={() => setSelectedFolderId(null)}
                        >
                          <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate flex-1">Other (no folder)</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-4 min-h-[200px]">
                      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {selectedFolderId === null ? 'Images in Other (no folder)' : galleryFolders.find(x => x.id === selectedFolderId)?.name ?? 'Images'}
                      </p>
                      <ImageUpload
                        value={imagesForFolder(selectedFolderId).map(i => i.image_url)}
                        onChange={v => setImagesForFolder(selectedFolderId, (v as string[]) || [])}
                        multiple
                        maxFiles={20}
                        previewClassName="object-cover"
                        bucket="gallery-images"
                        uploadOnSelect={true}
                      />
                      <div className="flex flex-wrap gap-2 mt-3">
                        {galleryImages.filter(img => (img.folder_id ?? null) === selectedFolderId).map((img, idx) => {
                          const globalIdx = galleryImages.findIndex(i => i === img);
                          return (
                            <div key={img.id ?? `${globalIdx}-${img.image_url}`} className="relative group w-14 h-14 rounded overflow-hidden border">
                              <img src={img.image_url} alt="Collaboration gallery image" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <Button type="button" variant="secondary" size="icon" className="h-5 w-5" onClick={() => removeImage(globalIdx)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
