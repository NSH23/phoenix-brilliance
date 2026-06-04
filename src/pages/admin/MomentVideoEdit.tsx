import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Film, Loader2, Play, Trash2 } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  adminPanelClass,
  adminRecordEditFormStackClass,
  adminRecordEditLayoutClass,
  adminRecordEditPreviewAsideClass,
} from '@/components/admin/adminStyles';
import {
  createContentMedia,
  deleteContentMedia,
  getContentMediaById,
  updateContentMedia,
} from '@/services/contentMedia';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MomentVideoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    url: '',
    title: '',
    thumbnail_url: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (isNew) return;
    if (!id) return;
    setLoading(true);
    getContentMediaById(id)
      .then((item) => {
        setForm({
          url: item.url,
          title: item.title || '',
          thumbnail_url: item.thumbnail_url || '',
          is_active: item.is_active,
          display_order: item.display_order,
        });
      })
      .catch(() => {
        toast.error('Video not found');
        navigate('/admin/media');
      })
      .finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  const youtubeId = getYouTubeId(form.url);
  const validYoutube = /^[a-zA-Z0-9_-]{11}$/.test(youtubeId);
  const previewThumb = form.thumbnail_url?.trim() || (validYoutube ? getYouTubeThumbnail(youtubeId) : '');

  const handleSave = async () => {
    if (!validYoutube) {
      toast.error('Enter a valid YouTube URL or 11-character video ID');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: 'moment' as const,
        media_type: 'video' as const,
        url: youtubeId,
        title: form.title.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        is_active: form.is_active,
        display_order: form.display_order,
      };
      if (isNew) {
        const created = await createContentMedia(payload);
        toast.success('Moment video added');
        navigate(`/admin/media/moments/${created.id}/edit`, { replace: true });
        return;
      }
      if (!id) return;
      await updateContentMedia(id, payload);
      toast.success('Moment video saved');
    } catch (err) {
      toast.error('Save failed', { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew || !confirm('Delete this moment video?')) return;
    try {
      await deleteContentMedia(id);
      toast.success('Deleted');
      navigate('/admin/media');
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    }
  };

  const detailsContent = (
    <div className={adminRecordEditLayoutClass}>
      <div className={adminRecordEditFormStackClass}>
        <AdminFormSection
          title="Publishing"
          description="Show or hide on the homepage Moments section"
          headerRight={<Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />}
        >
          <div className="flex items-center gap-3">
            {form.is_active ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <p className="text-sm">{form.is_active ? 'Active on homepage' : 'Hidden from homepage'}</p>
          </div>
        </AdminFormSection>

        <AdminFormSection title="YouTube video" description="Paste a link or video ID — embedded on the homepage">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="yt-url">YouTube URL or video ID *</Label>
              <Input
                id="yt-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=…"
                className="h-10 font-mono text-sm"
              />
              {form.url ? (
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, url: '' })}>
                    Clear video
                  </Button>
                </div>
              ) : null}
            </div>
            {validYoutube && previewThumb ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                <div className="relative aspect-video max-h-64 w-full bg-black">
                  <img src={previewThumb} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="h-14 w-14 text-white drop-shadow-lg" fill="currentColor" />
                  </div>
                </div>
                <p className="px-3 py-2 text-xs text-muted-foreground">Preview · ID: {youtubeId}</p>
              </div>
            ) : null}
          </div>
        </AdminFormSection>

        <AdminFormSection title="Metadata" description="Optional title, thumbnail override, and sort order">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Wedding highlight reel"
                className="h-10"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="thumb">Custom thumbnail URL</Label>
              <Input
                id="thumb"
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                className="h-10 text-sm"
              />
              <p className="text-xs text-muted-foreground">Leave empty to use the YouTube default thumbnail.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Display order</Label>
              <Input
                id="order"
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })}
                className="h-10"
              />
            </div>
          </div>
        </AdminFormSection>
      </div>

      <aside className={adminRecordEditPreviewAsideClass}>
        <div className={cn(adminPanelClass, 'overflow-hidden')}>
          <div className="relative aspect-[9/16] max-h-[420px] bg-muted">
            {previewThumb ? (
              <>
                <img src={previewThumb} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Film className="h-10 w-10 text-white/90" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Film className="h-10 w-10 opacity-40" />
                <span className="text-xs">No preview yet</span>
              </div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="font-semibold">{form.title || 'Untitled moment'}</p>
            <Badge variant={form.is_active ? 'default' : 'secondary'}>{form.is_active ? 'Active' : 'Hidden'}</Badge>
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      title={isNew ? 'New moment video' : form.title || 'Edit moment video'}
      subtitle="Homepage · Moments We've Crafted"
      backHref="/admin/media?tab=moment"
      backLabel="Manage videos"
      loading={loading}
      saving={saving}
      onSave={() => void handleSave()}
      onDelete={!isNew ? () => void handleDelete() : undefined}
      tabs={[{ value: 'details', label: 'Video details' }]}
      details={detailsContent}
    />
  );
}
