import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, MapPin, Loader2, FolderPlus, FolderOpen } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminSortableGrid, AdminSortableItem } from '@/components/admin/AdminSortableGrid';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  createCollaborationFolder,
  updateCollaborationFolder,
  deleteCollaborationFolder,
  seedCollaborationFolders,
  type Collaboration,
  type CollaborationFolder,
} from '@/services/collaborations';
import { resolvePublicStorageUrl } from '@/services/storage';
import { toast } from 'sonner';

function resolveLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return resolvePublicStorageUrl(url, 'partner-logos');
}

export default function AdminCollaborations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
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
  const [selectedRootFolderId, setSelectedRootFolderId] = useState<string | null>(null);
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string | null>(null);
  const [newRootFolderName, setNewRootFolderName] = useState('');
  const [newSubfolderName, setNewSubfolderName] = useState('');

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

  useEffect(() => {
    setSelectedSubfolderId(null);
  }, [selectedRootFolderId]);

  const filteredCollaborations = collaborations.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showReorder = !searchQuery.trim();
  const listForCards = showReorder
    ? [...collaborations].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    : filteredCollaborations;

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
      logger.error('Failed to save venue order', err, { component: 'AdminCollaborations', action: 'persistOrder' });
      toast.error('Failed to save order', { description: (err as Error)?.message });
      void load();
    } finally {
      setIsReordering(false);
    }
  };

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
    }
    setSelectedRootFolderId(null);
    setSelectedSubfolderId(null);
    setNewRootFolderName('');
    setNewSubfolderName('');
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
      toast.success('Standard folders created. Enable the ones you need and add images, then Save.');
    } catch (err: unknown) {
      toast.error('Failed to create folders', { description: (err as Error)?.message });
    }
  };

  const getImagesForFolder = (folderId: string | null) =>
    galleryImages.filter((img) => (img.folder_id ?? null) === folderId).map((img) => img.image_url);

  const setImagesForFolder = (folderId: string | null, urls: string[]) => {
    const existingInFolder = galleryImages.filter((img) => (img.folder_id ?? null) === folderId);
    setGalleryImages(prev => {
      const others = prev.filter((img) => (img.folder_id ?? null) !== folderId);
      const merged = urls.map((url, i) => {
        const found = existingInFolder.find((e) => e.image_url === url);
        return found ? { ...found, display_order: i } : { image_url: url, folder_id: folderId, display_order: i };
      });
      return [...others, ...merged];
    });
  };

  const handleCreateRootFolder = async () => {
    if (!editingCollab) return;
    const name = newRootFolderName.trim();
    if (!name) {
      toast.error('Folder name is required');
      return;
    }

    setCreatingFolder(true);
    try {
      const root = galleryFolders.filter(f => !f.parent_id);
      const nextOrder = root.length > 0 ? Math.max(...root.map(f => f.display_order ?? 0)) + 1 : 0;

      const created = await createCollaborationFolder({
        collaboration_id: editingCollab.id,
        parent_id: null,
        name,
        display_order: nextOrder,
        is_enabled: true,
      });

      const folders = await getCollaborationFolders(editingCollab.id);
      setGalleryFolders(
        folders.map(f => ({
          id: f.id,
          collaboration_id: f.collaboration_id,
          parent_id: f.parent_id,
          name: f.name,
          display_order: f.display_order,
          is_enabled: f.is_enabled ?? false,
        }))
      );
      setSelectedRootFolderId(created.id);
      toast.success('Folder created.');
    } catch (err: unknown) {
      toast.error('Failed to create folder', { description: (err as Error)?.message });
    } finally {
      setCreatingFolder(false);
      setNewRootFolderName('');
    }
  };

  const handleCreateSubfolder = async () => {
    if (!editingCollab) return;
    if (!selectedRootFolderId) {
      toast.error('Please select a parent folder first.');
      return;
    }
    const name = newSubfolderName.trim();
    if (!name) {
      toast.error('Subfolder name is required');
      return;
    }
    setCreatingFolder(true);
    try {
      const existingChildren = galleryFolders.filter(f => f.parent_id === selectedRootFolderId);
      const nextOrder = existingChildren.length > 0 ? Math.max(...existingChildren.map(f => f.display_order ?? 0)) + 1 : 0;
      const created = await createCollaborationFolder({
        collaboration_id: editingCollab.id,
        parent_id: selectedRootFolderId,
        name,
        display_order: nextOrder,
        is_enabled: true,
      });
      setGalleryFolders((prev) => [...prev, created]);
      setSelectedSubfolderId(created.id);
      toast.success('Subfolder created.');
    } catch (err: unknown) {
      toast.error('Failed to create subfolder', { description: (err as Error)?.message });
    } finally {
      setCreatingFolder(false);
      setNewSubfolderName('');
    }
  };

  const handleDeleteFolder = async () => {
    if (!editingCollab) return;
    const targetFolderId = selectedSubfolderId || selectedRootFolderId;
    if (!targetFolderId) {
      toast.error('Select a folder/subfolder to delete.');
      return;
    }
    if (!confirm('Delete this folder? Images will be moved to unassigned.')) return;
    try {
      const children = galleryFolders.filter(f => f.parent_id === targetFolderId).map(f => f.id);
      const affectedFolderIds = [targetFolderId, ...children];

      // Move images from deleted folders to "no folder"
      for (const img of galleryImages) {
        if (img.id && img.folder_id && affectedFolderIds.includes(img.folder_id)) {
          await updateCollaborationImage(img.id, { folder_id: null });
        }
      }

      // Delete child folders first, then parent
      for (const childId of children) {
        await deleteCollaborationFolder(childId);
      }
      await deleteCollaborationFolder(targetFolderId);

      setGalleryFolders((prev) => prev.filter(f => !affectedFolderIds.includes(f.id)));
      setGalleryImages((prev) =>
        prev.map((img) => (img.folder_id && affectedFolderIds.includes(img.folder_id) ? { ...img, folder_id: null } : img))
      );
      setSelectedSubfolderId(null);
      setSelectedRootFolderId(null);
      toast.success('Folder deleted.');
    } catch (err: unknown) {
      toast.error('Failed to delete folder', { description: (err as Error)?.message });
    }
  };

  const rootFolders = galleryFolders.filter(f => !f.parent_id).sort((a, b) => a.display_order - b.display_order);
  const getChildFolders = (parentId: string) =>
    galleryFolders.filter(f => f.parent_id === parentId).sort((a, b) => a.display_order - b.display_order);
  const selectedUploadFolderId = selectedSubfolderId || selectedRootFolderId;
  const selectedUploadFolderName = selectedUploadFolderId
    ? galleryFolders.find((f) => f.id === selectedUploadFolderId)?.name || 'Selected folder'
    : 'No folder (uncategorized)';

  const renderVenueCard = (c: Collaboration) => (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col max-md:flex-row max-md:items-start max-md:gap-3 max-md:cursor-pointer"
      onClick={() => {
        if (window.innerWidth < 768) handleOpenDialog(c);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (window.innerWidth < 768) handleOpenDialog(c);
        }
      }}
    >
      <div className="p-3 md:p-6 flex-1">
        <div className="flex items-start justify-between mb-2 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted shrink-0">
              {c.logo_url ? (
                <img
                  src={resolveLogoUrl(c.logo_url)!}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-xs md:text-sm">
                  {c.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-base md:text-base truncate">{c.name}</h3>
              <div className="flex items-center gap-1 text-xs md:text-xs text-muted-foreground truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{c.location || '—'}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-8 md:w-8 max-md:h-10 max-md:w-10 -mr-1 md:mr-0"
                onClick={(e) => e.stopPropagation()}
              >
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
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 hidden md:block">{c.description || '—'}</p>
        <div className="flex items-center justify-between gap-2 mt-2 md:mt-0">
          <span className="text-xs md:text-xs text-muted-foreground">Order: {c.display_order ?? 0}</span>
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 md:px-2 md:py-1 text-xs md:text-xs font-medium ring-1 ring-inset ${
              c.is_active
                ? 'bg-primary/10 text-primary ring-primary/20'
                : 'bg-muted text-muted-foreground ring-border'
            }`}
          >
            {c.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="px-3 py-2 md:px-6 md:py-3 bg-muted/50 border-t flex items-center justify-between">
        <span className="text-xs md:text-xs text-muted-foreground">Status</span>
        <Switch
          checked={c.is_active}
          onCheckedChange={() => handleToggleActive(c)}
          onClick={(e) => e.stopPropagation()}
          className="h-6 w-11"
        />
      </div>
    </Card>
  );

  return (
    <AdminLayout title="Venues" subtitle="Manage venue partners and their gallery folders">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 max-md:h-11"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 max-md:h-11">
          <Plus className="w-4 h-4" />
          Add Venue
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {collaborations.length >= 2 && (
            <p className="text-xs text-muted-foreground mb-2">
              {showReorder
                ? 'Drag the grip on a card to reorder. Changes apply on the site immediately.'
                : 'Clear search to drag and reorder cards.'}
            </p>
          )}
          {showReorder ? (
            <AdminSortableGrid
              itemIds={listForCards.map((c) => c.id)}
              disabled={isReordering}
              onReorder={persistCollaborationOrder}
              className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-6 max-md:grid-cols-1"
            >
              {listForCards.map((c, i) => (
                <AdminSortableItem key={c.id} id={c.id} disabled={isReordering}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {renderVenueCard(c)}
                  </motion.div>
                </AdminSortableItem>
              ))}
            </AdminSortableGrid>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-6 max-md:grid-cols-1">
              {listForCards.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {renderVenueCard(c)}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && filteredCollaborations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No venues found.</div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollab ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
            <DialogDescription>
              {editingCollab ? 'Update venue details and gallery folders.' : 'Add a new venue partner. It will be saved to the database.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Venue Name</Label>
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
                    <span className="text-xs text-muted-foreground">Select folder and subfolder from dropdowns, then upload images.</span>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-lg border bg-card p-3">
                    <Label className="text-sm">Folder</Label>
                    <Select
                      value={selectedRootFolderId ?? '__none__'}
                      onValueChange={(v) => setSelectedRootFolderId(v === '__none__' ? null : v)}
                    >
                      <SelectTrigger className="max-md:h-11">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No folder (uncategorized)</SelectItem>
                        {rootFolders.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label className="text-sm">Subfolder</Label>
                    <Select
                      value={selectedSubfolderId ?? '__none__'}
                      onValueChange={(v) => setSelectedSubfolderId(v === '__none__' ? null : v)}
                    >
                      <SelectTrigger className="max-md:h-11">
                        <SelectValue placeholder="Select subfolder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No subfolder</SelectItem>
                        {selectedRootFolderId &&
                          getChildFolders(selectedRootFolderId).map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {selectedRootFolderId && (
                      <div className="flex items-center justify-between rounded-md border p-2">
                        <span className="text-xs text-muted-foreground">Show selected folder on site</span>
                        <Switch
                          checked={galleryFolders.find((f) => f.id === (selectedSubfolderId || selectedRootFolderId))?.is_enabled ?? false}
                          onCheckedChange={() => toggleFolderEnabled(selectedSubfolderId || selectedRootFolderId)}
                        />
                      </div>
                    )}

                    <div className="space-y-2 border-t pt-2">
                      <Label className="text-xs text-muted-foreground">Create new folder</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newRootFolderName}
                          onChange={(e) => setNewRootFolderName(e.target.value)}
                          placeholder="e.g., Wedding"
                          className="max-md:h-11"
                        />
                        <Button type="button" variant="outline" onClick={handleCreateRootFolder} disabled={creatingFolder} className="max-md:h-11">
                          <FolderPlus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Create subfolder</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newSubfolderName}
                          onChange={(e) => setNewSubfolderName(e.target.value)}
                          placeholder="e.g., Ceremony"
                          className="max-md:h-11"
                        />
                        <Button type="button" variant="outline" onClick={handleCreateSubfolder} disabled={creatingFolder || !selectedRootFolderId} className="max-md:h-11">
                          <FolderOpen className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteFolder}
                      disabled={!selectedRootFolderId && !selectedSubfolderId}
                      className="w-full max-md:h-11"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete selected folder/subfolder
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-card p-4 min-h-[200px]">
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Uploading to: {selectedUploadFolderName}
                    </p>
                    <ImageUpload
                      value={getImagesForFolder(selectedUploadFolderId)}
                      onChange={(v) => setImagesForFolder(selectedUploadFolderId, (v as string[]) || [])}
                      multiple
                      maxFiles={20}
                      previewClassName="object-cover"
                      bucket="gallery-images"
                      enableBulkDelete={true}
                      uploadOnSelect={true}
                    />
                  </div>
                </div>
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

          <DialogFooter className="mt-6 max-md:flex-col max-md:items-stretch max-md:gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="max-md:h-11">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="max-md:h-11">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving... </> : (editingCollab ? 'Save Changes' : 'Create Venue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
