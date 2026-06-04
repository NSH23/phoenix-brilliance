import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, ImageIcon } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import ImageUpload from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  adminPanelClass,
  adminRecordEditFormStackClass,
  adminRecordEditLayoutClass,
  adminRecordEditPreviewAsideClass,
} from '@/components/admin/adminStyles';
import { createService, deleteService, getAllServices, updateService } from '@/services/services';
import { resolvePublicStorageUrl } from '@/services/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ServiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
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
    if (isNew) return;
    if (!id) return;
    setLoading(true);
    getAllServices()
      .then((list) => {
        const s = list.find((x) => x.id === id);
        if (!s) throw new Error('Not found');
        setFormData({
          title: s.title,
          description: s.description || '',
          icon: s.icon || '',
          image_url: s.image_url || '',
          features: (s.features || []).join(', '),
          isActive: s.is_active ?? true,
          display_order: s.display_order ?? 0,
        });
      })
      .catch(() => {
        toast.error('Service not found');
        navigate('/admin/services');
      })
      .finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (!isNew) return;
    getAllServices().then((list) => {
      const nextOrder = list.length > 0 ? Math.max(...list.map((s) => s.display_order ?? 0)) + 1 : 0;
      setFormData((f) => ({ ...f, display_order: nextOrder }));
    });
  }, [isNew]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const featuresArray = formData.features.split(',').map((f) => f.trim()).filter(Boolean);
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
        image_url: formData.image_url || null,
        features: featuresArray,
        is_active: formData.isActive,
        display_order: formData.display_order,
      };
      if (isNew) {
        const created = await createService(payload);
        toast.success('Service created');
        navigate(`/admin/services/${created.id}/edit`, { replace: true });
        return;
      }
      if (!id) return;
      await updateService(id, payload);
      toast.success('Service saved');
    } catch (err) {
      toast.error('Save failed', { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew || !confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      toast.success('Service deleted');
      navigate('/admin/services');
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    }
  };

  const imagePreview = formData.image_url
    ? resolvePublicStorageUrl(formData.image_url, 'service-images')
    : null;

  const detailsContent = (
    <div className={adminRecordEditLayoutClass}>
      <div className={adminRecordEditFormStackClass}>
        <AdminFormSection
          title="Publishing"
          headerRight={<Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />}
        >
          <div className="flex items-center gap-3">
            {formData.isActive ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <p className="text-sm">{formData.isActive ? 'Visible on website' : 'Hidden from website'}</p>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Service details">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Service title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon (Lucide name)</Label>
                <Input id="icon" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="Calendar" className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display_order">Display order</Label>
                <Input id="display_order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })} className="h-10" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input id="features" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} className="h-10" />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Service image">
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: (url as string) || '' })}
            bucket="service-images"
            uploadOnSelect
            previewClassName="aspect-video w-full object-cover"
            enableCropAdjust
            cropAspect={16 / 9}
          />
        </AdminFormSection>
      </div>

      <aside className={adminRecordEditPreviewAsideClass}>
        <div className={cn(adminPanelClass, 'overflow-hidden p-4')}>
          <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
          <p className="font-semibold">{formData.title || 'Untitled service'}</p>
          <Badge className="mt-2" variant={formData.isActive ? 'default' : 'secondary'}>
            {formData.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      title={isNew ? 'New service' : formData.title || 'Edit service'}
      subtitle="Service offering"
      backHref="/admin/services"
      backLabel="Services"
      loading={loading}
      saving={saving}
      onSave={() => void handleSave()}
      onDelete={!isNew ? () => void handleDelete() : undefined}
      tabs={[{ value: 'details', label: 'Details' }]}
      details={detailsContent}
    />
  );
}
