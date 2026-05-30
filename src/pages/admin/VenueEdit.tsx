import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import AdminMediaExplorer from '@/components/admin/AdminMediaExplorer';
import ImageUpload from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { adminPanelClass } from '@/components/admin/adminStyles';
import {
  createCollaboration,
  createCollaborationFolder,
  createCollaborationImage,
  deleteCollaboration,
  deleteCollaborationFolder,
  deleteCollaborationImage,
  getCollaborationById,
  getCollaborationFolders,
  getCollaborationImages,
  seedCollaborationFolders,
  updateCollaboration,
  updateCollaborationFolder,
  updateCollaborationImage,
  type Collaboration,
  type CollaborationFolder,
} from '@/services/collaborations';
import { GALLERY_ROOT_ID, type ExplorerFolder, type ExplorerMediaItem } from '@/lib/mediaFolderTree';
import { resolvePublicStorageUrl } from '@/services/storage';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

type GalleryImageRow = ExplorerMediaItem & { id?: string };

function mapFolders(folders: CollaborationFolder[]): ExplorerFolder[] {
  return folders.map((f) => ({
    id: f.id,
    parent_id: f.parent_id,
    name: f.name,
    display_order: f.display_order,
    is_enabled: f.is_enabled ?? false,
    cover_image_url: f.cover_image_url ?? null,
  }));
}

function mapImages(
  imgs: Array<{ id: string; image_url: string; folder_id: string | null; display_order: number; media_type?: string; caption?: string | null }>
): GalleryImageRow[] {
  return imgs.map((img, i) => ({
    id: img.id,
    url: img.image_url,
    folder_id: img.folder_id ?? null,
    display_order: img.display_order ?? i,
    media_type: img.media_type === 'video' ? 'video' : 'image',
    caption: img.caption ?? null,
  }));
}

export default function VenueEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
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
  const [galleryFolders, setGalleryFolders] = useState<ExplorerFolder[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImageRow[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(GALLERY_ROOT_ID);
  const [venueImages, setVenueImages] = useState<string[]>([]);

  const loadVenue = useCallback(
    async (venueId: string) => {
      setLoading(true);
      try {
        const full = (await getCollaborationById(venueId)) as Collaboration & {
          collaboration_images?: Array<{ id: string; image_url: string; folder_id: string | null; display_order: number; media_type?: string; caption?: string | null }>;
          collaboration_folders?: CollaborationFolder[];
        };
        setEditingCollab(full);
        setFormData({
          name: full.name,
          logoUrl: full.logo_url || '',
          bannerUrl: full.banner_url || '',
          description: full.description || '',
          location: full.location || '',
          mapUrl: full.map_url || '',
          isActive: full.is_active ?? true,
          display_order: full.display_order ?? 0,
        });
        const imgs = full.collaboration_images || [];
        const folders = full.collaboration_folders || [];
        setGalleryImages(mapImages(imgs));
        setGalleryFolders(mapFolders(folders));
        setSelectedFolderId(GALLERY_ROOT_ID);
      } catch (err) {
        logger.error('Failed to load venue', err, { component: 'VenueEditPage' });
        toast.error('Failed to load venue');
        navigate('/admin/collaborations');
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (isNew) {
      setSelectedFolderId(GALLERY_ROOT_ID);
      return;
    }
    if (id) void loadVenue(id);
  }, [id, isNew, loadVenue]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Venue name is required');
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

      if (isNew) {
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
        toast.success('Venue created');
        navigate(`/admin/collaborations/${created.id}/edit`, { replace: true });
        return;
      }

      if (!editingCollab) return;
      await updateCollaboration(editingCollab.id, base);
      const collabId = editingCollab.id;

      for (const folder of galleryFolders) {
        await updateCollaborationFolder(folder.id, {
          name: folder.name,
          display_order: folder.display_order,
          is_enabled: folder.is_enabled,
          cover_image_url: folder.cover_image_url ?? null,
        });
      }

      const validFolderIds = new Set(galleryFolders.map((f) => f.id));
      const resolveFolderId = (fid: string | null): string | null => {
        if (!fid) return null;
        return validFolderIds.has(fid) ? fid : null;
      };

      const existingImages = await getCollaborationImages(collabId);
      const existingIds = new Set(existingImages.map((i) => i.id));
      const currentImageIds = new Set(galleryImages.filter((i) => i.id).map((i) => i.id!));

      for (const img of galleryImages) {
        const folderId = resolveFolderId(img.folder_id);
        if (img.id && existingIds.has(img.id)) {
          const existing = existingImages.find((e) => e.id === img.id);
          const updates: Parameters<typeof updateCollaborationImage>[1] = {};
          if (existing?.folder_id !== folderId) updates.folder_id = folderId;
          if (existing && (existing.image_url !== img.url || existing.media_type !== img.media_type)) {
            updates.image_url = img.url;
            updates.media_type = img.media_type;
          }
          if (existing && (existing.caption ?? '') !== (img.caption ?? '')) {
            updates.caption = img.caption ?? null;
          }
          if (Object.keys(updates).length > 0) {
            await updateCollaborationImage(img.id, updates);
          }
        } else if (!img.id) {
          await createCollaborationImage({
            collaboration_id: collabId,
            image_url: img.url,
            caption: img.caption ?? null,
            display_order: img.display_order,
            folder_id: folderId,
            media_type: img.media_type ?? 'image',
          });
        }
      }
      for (const e of existingImages) {
        if (!currentImageIds.has(e.id)) await deleteCollaborationImage(e.id);
      }

      toast.success('Venue saved');
      void loadVenue(collabId);
    } catch (err: unknown) {
      toast.error('Save failed', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCollab || !confirm('Delete this venue permanently?')) return;
    try {
      await deleteCollaboration(editingCollab.id);
      toast.success('Venue deleted');
      navigate('/admin/collaborations');
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    }
  };

  const handleCreateRootFolder = async (name: string) => {
    if (!editingCollab) return;
    setCreatingFolder(true);
    try {
      const root = galleryFolders.filter((f) => !f.parent_id);
      const nextOrder = root.length > 0 ? Math.max(...root.map((f) => f.display_order ?? 0)) + 1 : 0;
      const created = await createCollaborationFolder({
        collaboration_id: editingCollab.id,
        parent_id: null,
        name,
        display_order: nextOrder,
        is_enabled: true,
      });
      setGalleryFolders((prev) => [...prev, mapFolders([created])[0]!]);
      setSelectedFolderId(created.id);
      toast.success('Category created');
    } catch (err) {
      toast.error('Failed to create folder', { description: (err as Error).message });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleCreateSubfolder = async (parentId: string, name: string) => {
    if (!editingCollab) return;
    setCreatingFolder(true);
    try {
      const siblings = galleryFolders.filter((f) => f.parent_id === parentId);
      const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((f) => f.display_order ?? 0)) + 1 : 0;
      const created = await createCollaborationFolder({
        collaboration_id: editingCollab.id,
        parent_id: parentId,
        name,
        display_order: nextOrder,
        is_enabled: true,
      });
      setGalleryFolders((prev) => [...prev, mapFolders([created])[0]!]);
      setSelectedFolderId(created.id);
      toast.success('Subfolder created');
    } catch (err) {
      toast.error('Failed to create subfolder', { description: (err as Error).message });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Images inside will move to Uncategorized on save.')) return;
    try {
      await deleteCollaborationFolder(folderId);
      const childIds = galleryFolders.filter((f) => f.parent_id === folderId).map((f) => f.id);
      setGalleryFolders((prev) => prev.filter((f) => f.id !== folderId && f.parent_id !== folderId));
      setGalleryImages((prev) =>
        prev.map((img) =>
          img.folder_id === folderId || (img.folder_id && childIds.includes(img.folder_id))
            ? { ...img, folder_id: null }
            : img
        )
      );
      setSelectedFolderId(GALLERY_ROOT_ID);
      toast.success('Folder deleted');
    } catch (err) {
      toast.error('Failed to delete folder', { description: (err as Error).message });
    }
  };

  const handleSeedFolders = async () => {
    if (!editingCollab) return;
    try {
      await seedCollaborationFolders(editingCollab.id);
      const folders = await getCollaborationFolders(editingCollab.id);
      setGalleryFolders(mapFolders(folders));
      setSelectedFolderId(GALLERY_ROOT_ID);
      toast.success('Standard categories imported — enable the ones you need.');
    } catch (err) {
      toast.error('Failed to import categories', { description: (err as Error).message });
    }
  };

  const logoPreview = formData.logoUrl
    ? resolvePublicStorageUrl(formData.logoUrl, 'partner-logos')
    : null;
  const bannerPreview = formData.bannerUrl
    ? resolvePublicStorageUrl(formData.bannerUrl, 'gallery-images')
    : null;

  const detailsContent = (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <AdminFormSection
          title="Publishing"
          description="Control whether this venue appears on the public website"
          headerRight={
            <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />
          }
        >
          <div className="flex items-center gap-3">
            {formData.isActive ? (
              <Eye className="h-4 w-4 text-primary" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">{formData.isActive ? 'Visible on website' : 'Hidden from website'}</p>
              <p className="text-xs text-muted-foreground">
                {formData.isActive ? 'Customers can view this venue and gallery' : 'Only visible in admin until published'}
              </p>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="General information" description="Core venue identity and listing order">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">Venue name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sky Blue Banquet"
                className="h-10"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe the venue, capacity, and highlights…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_order">Display order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                className="h-10"
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Branding" description="Logo and hero banner shown on the venue page">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Partner logo</Label>
              <ImageUpload
                value={formData.logoUrl}
                onChange={(v) => setFormData({ ...formData, logoUrl: (v as string) || '' })}
                multiple={false}
                previewClassName="object-contain"
                bucket="partner-logos"
                uploadOnSelect
                enableCropAdjust
                cropAspect={1}
              />
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="Or paste logo URL"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Hero banner</Label>
              <ImageUpload
                value={formData.bannerUrl}
                onChange={(v) => setFormData({ ...formData, bannerUrl: (v as string) || '' })}
                multiple={false}
                previewClassName="object-cover"
                bucket="gallery-images"
                uploadOnSelect
                enableCropAdjust
                cropAspect={16 / 9}
              />
              <Input
                value={formData.bannerUrl}
                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                placeholder="Or paste banner URL"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Location" description="Address and map link for customers">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Area, city"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mapUrl">Google Maps URL</Label>
              <Input
                id="mapUrl"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                placeholder="https://maps.google.com/…"
                className="h-10"
              />
            </div>
          </div>
        </AdminFormSection>

        {isNew ? (
          <AdminFormSection title="Initial photos" description="Optional — organize into folders after saving">
            <ImageUpload
              value={venueImages}
              onChange={(v) => setVenueImages((v as string[]) || [])}
              multiple
              maxFiles={20}
              bucket="gallery-images"
              uploadOnSelect
            />
          </AdminFormSection>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className={cn(adminPanelClass, 'overflow-hidden')}>
          <div className="relative aspect-[16/10] bg-muted">
            {bannerPreview ? (
              <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No banner</div>
            )}
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg font-semibold text-muted-foreground">
                    {formData.name.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{formData.name || 'Untitled venue'}</p>
                {formData.location ? (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {formData.location}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                {formData.isActive ? 'Published' : 'Draft'}
              </Badge>
              {!isNew ? (
                <Badge variant="outline">{galleryImages.length} media</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      title={isNew ? 'New venue' : formData.name || 'Edit venue'}
      subtitle={isNew ? 'Create a partner venue record' : 'Venue partner · details & gallery'}
      backHref="/admin/collaborations"
      backLabel="Venues"
      loading={loading}
      saving={saving}
      onSave={() => void handleSave()}
      onDelete={!isNew ? () => void handleDelete() : undefined}
      tabs={[
        { value: 'details', label: 'Details' },
        { value: 'gallery', label: 'Gallery', disabled: isNew },
      ]}
      details={detailsContent}
      gallery={
        !isNew ? (
          <div className="space-y-3">
            <AdminMediaExplorer
              folders={galleryFolders}
              media={galleryImages}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onFoldersChange={setGalleryFolders}
              onMediaChange={setGalleryImages}
              uploadBucket="gallery-images"
              onCreateRootFolder={handleCreateRootFolder}
              onCreateSubfolder={handleCreateSubfolder}
              onDeleteFolder={handleDeleteFolder}
              onSeedStandardFolders={handleSeedFolders}
              creatingFolder={creatingFolder}
            />
            <p className="text-xs text-muted-foreground">Changes to folders and media are saved when you click Save changes.</p>
          </div>
        ) : undefined
      }
    />
  );
}
