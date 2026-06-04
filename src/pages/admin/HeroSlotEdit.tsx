import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, ImageIcon, Loader2, Play } from 'lucide-react';
import AdminRecordEditShell from '@/components/admin/AdminRecordEditShell';
import AdminFormSection from '@/components/admin/AdminFormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  adminPanelClass,
  adminRecordEditFormStackClass,
  adminRecordEditLayoutClass,
  adminRecordEditPreviewAsideClass,
} from '@/components/admin/adminStyles';
import {
  createContentMedia,
  deleteContentMedia,
  getAllContentMedia,
  updateContentMedia,
} from '@/services/contentMedia';
import { uploadContentMediaFile } from '@/lib/contentMediaUpload';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const HERO_SLOTS: Record<
  string,
  { index: number; label: string; mediaType: 'video' | 'image'; description: string }
> = {
  '0': {
    index: 0,
    label: 'Hero Video (front)',
    mediaType: 'video',
    description: 'YouTube video shown in front of the homepage hero',
  },
  '1': {
    index: 1,
    label: 'Background Image 1',
    mediaType: 'image',
    description: 'First background layer behind the hero video',
  },
  '2': {
    index: 2,
    label: 'Background Image 2',
    mediaType: 'image',
    description: 'Second background layer behind the hero video',
  },
};

export default function HeroSlotEditPage() {
  const { slot } = useParams<{ slot: string }>();
  const navigate = useNavigate();
  const slotConfig = slot ? HERO_SLOTS[slot] : undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    url: '',
    title: '',
    thumbnail_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (!slotConfig) {
      toast.error('Invalid hero slot');
      navigate('/admin/media?tab=hero');
      return;
    }

    setLoading(true);
    getAllContentMedia('hero')
      .then((items) => {
        const match = items.find((i) => i.display_order === slotConfig.index) ?? null;
        if (match) {
          setExistingId(match.id);
          setForm({
            url: match.url,
            title: match.title || '',
            thumbnail_url: match.thumbnail_url || '',
            is_active: match.is_active,
          });
        } else {
          setExistingId(null);
          setForm({ url: '', title: '', thumbnail_url: '', is_active: true });
        }
      })
      .catch(() => toast.error('Failed to load hero slot'))
      .finally(() => setLoading(false));
  }, [slotConfig, navigate]);

  if (!slotConfig) return null;

  const isVideo = slotConfig.mediaType === 'video';
  const youtubeId = getYouTubeId(form.url);
  const validYoutube = /^[a-zA-Z0-9_-]{11}$/.test(youtubeId);
  const videoPreviewThumb =
    form.thumbnail_url?.trim() || (validYoutube ? getYouTubeThumbnail(youtubeId) : '');
  const imagePreview = !isVideo && form.url.trim() ? form.url.trim() : '';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadContentMediaFile(file, setUploadProgress);
      setForm((prev) => ({ ...prev, url }));
      toast.success('Image uploaded — click Save changes to apply');
    } catch (err) {
      toast.error('Upload failed', { description: (err as Error).message });
    } finally {
      setUploadProgress(0);
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    let mediaUrl = form.url.trim();

    if (isVideo) {
      if (!validYoutube) {
        toast.error('Enter a valid YouTube URL or 11-character video ID');
        return;
      }
      mediaUrl = youtubeId;
    } else if (!mediaUrl) {
      toast.error('Upload an image or enter an image URL');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category: 'hero' as const,
        media_type: slotConfig.mediaType,
        url: mediaUrl,
        title: form.title.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        is_active: form.is_active,
        display_order: slotConfig.index,
      };

      if (existingId) {
        await updateContentMedia(existingId, payload);
        toast.success('Hero slot saved');
      } else {
        const created = await createContentMedia(payload);
        setExistingId(created.id);
        toast.success('Hero slot added');
      }
    } catch (err) {
      toast.error('Save failed', { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingId || !confirm(`Remove ${slotConfig.label}?`)) return;
    try {
      await deleteContentMedia(existingId);
      toast.success('Removed');
      navigate('/admin/media?tab=hero');
    } catch (err) {
      toast.error('Delete failed', { description: (err as Error).message });
    }
  };

  const detailsContent = (
    <div className={adminRecordEditLayoutClass}>
      <div className={adminRecordEditFormStackClass}>
        <AdminFormSection
          title="Publishing"
          description="Show or hide this slot on the homepage hero"
          headerRight={
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          }
        >
          <div className="flex items-center gap-3">
            {form.is_active ? (
              <Eye className="h-4 w-4 text-primary" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <p className="text-sm">
              {form.is_active ? 'Active on homepage hero' : 'Hidden from homepage hero'}
            </p>
          </div>
        </AdminFormSection>

        {isVideo ? (
          <AdminFormSection
            title="YouTube video"
            description="Paste a link or video ID — embedded in the homepage hero"
          >
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm({ ...form, url: '' })}
                    >
                      Clear video
                    </Button>
                  </div>
                ) : null}
              </div>
              {validYoutube && videoPreviewThumb ? (
                <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                  <div className="relative aspect-video max-h-64 w-full bg-black">
                    <img src={videoPreviewThumb} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="h-14 w-14 text-white drop-shadow-lg" fill="currentColor" />
                    </div>
                  </div>
                  <p className="px-3 py-2 text-xs text-muted-foreground">Preview · ID: {youtubeId}</p>
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Videos are embedded from YouTube. Paste a full link or the 11-character video ID.
              </p>
            </div>
          </AdminFormSection>
        ) : (
          <AdminFormSection
            title="Background image"
            description="Upload a file or paste a direct image URL"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="image-upload">Image file</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="cursor-pointer"
                  onChange={(e) => void handleImageUpload(e)}
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                    <p className="flex items-center justify-between gap-2 text-sm text-primary">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading…
                      </span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </p>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image-url">Or image URL</Label>
                <Input
                  id="image-url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="h-10 text-sm"
                />
                {form.url ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm({ ...form, url: '' })}
                    >
                      Clear image
                    </Button>
                  </div>
                ) : null}
              </div>
              {imagePreview ? (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <img src={imagePreview} alt="" className="max-h-64 w-full object-cover" />
                </div>
              ) : null}
            </div>
          </AdminFormSection>
        )}

        <AdminFormSection title="Metadata" description="Optional title and thumbnail override">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isVideo ? 'e.g. Hero video' : 'e.g. Hero background'}
                className="h-10"
              />
            </div>
            {isVideo ? (
              <div className="grid gap-2">
                <Label htmlFor="thumb">Custom thumbnail URL</Label>
                <Input
                  id="thumb"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Optional preview image. For YouTube: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
                </p>
              </div>
            ) : null}
          </div>
        </AdminFormSection>
      </div>

      <aside className={adminRecordEditPreviewAsideClass}>
        <div className={cn(adminPanelClass, 'overflow-hidden')}>
          <div className="relative aspect-video bg-muted">
            {isVideo ? (
              videoPreviewThumb ? (
                <>
                  <img src={videoPreviewThumb} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-10 w-10 text-white/90" fill="currentColor" />
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Play className="h-10 w-10 opacity-40" />
                  <span className="text-xs">No video yet</span>
                </div>
              )
            ) : imagePreview ? (
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-10 w-10 opacity-40" />
                <span className="text-xs">No image yet</span>
              </div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="font-semibold">{slotConfig.label}</p>
            <Badge variant={form.is_active ? 'default' : 'secondary'}>
              {form.is_active ? 'Active' : 'Hidden'}
            </Badge>
            {!existingId ? (
              <p className="text-xs text-muted-foreground">Not configured yet</p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <AdminRecordEditShell
      title={slotConfig.label}
      subtitle={`Homepage hero · ${slotConfig.description}`}
      backHref="/admin/media?tab=hero"
      backLabel="Manage videos"
      loading={loading}
      saving={saving || uploading}
      onSave={() => void handleSave()}
      onDelete={existingId ? () => void handleDelete() : undefined}
      tabs={[{ value: 'details', label: isVideo ? 'Video details' : 'Image details' }]}
      details={detailsContent}
    />
  );
}
