import { useEffect, useState } from 'react';
import { Loader2, Upload, Save } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getSiteSettingOptional, upsertSiteSetting } from '@/services/siteContent';

type BackgroundItem = {
  id: string;
  label: string;
  settingKey: string;
  usage: string;
  fallbackUrl: string;
  url: string;
  uploading: boolean;
  uploadProgress: number;
};

const DEFAULT_BG_BASE = 'https://res.cloudinary.com/dutkr9zku/image/upload/f_auto,q_auto:good,w_1920/phoenix/backgrounds';

const BG_CONFIG: Array<Omit<BackgroundItem, 'url' | 'uploading'>> = [
  { id: '3', label: 'Background 3', settingKey: 'bg_image_3', usage: 'Homepage section background (3.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/3.jpg` },
  { id: '5', label: 'Background 5', settingKey: 'bg_image_5', usage: 'Homepage section background (5.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/5.jpg` },
  { id: '7', label: 'Background 7', settingKey: 'bg_image_7', usage: 'Services section background (7.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/7.jpg` },
  { id: '9', label: 'Background 9', settingKey: 'bg_image_9', usage: 'Events/About section background (9.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/9.jpg` },
  { id: '1_5', label: 'Background 1.5', settingKey: 'bg_image_1_5', usage: 'Services dark background (1.5.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/1.5.jpg` },
  { id: 'bg2', label: 'Background BG2', settingKey: 'bg_image_bg2', usage: 'Events dark container background (bg2.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/bg2.jpg` },
  { id: 'bg12', label: 'Background BG12', settingKey: 'bg_image_bg12', usage: 'Collaborations/About dark background (bg12.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/bg12.jpg` },
  { id: 'dt1', label: 'Background DT1', settingKey: 'bg_image_dt1', usage: 'About/Testimonials dark background (dt1.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/dt1.jpg` },
  { id: 'lgt4', label: 'Background LGT4', settingKey: 'bg_image_lgt4', usage: 'Testimonials light background (lgt4.jpg)', fallbackUrl: `${DEFAULT_BG_BASE}/lgt4.jpg` },
];

export default function AdminBackgroundImages() {
  const [items, setItems] = useState<BackgroundItem[]>(
    BG_CONFIG.map((i) => ({ ...i, url: i.fallbackUrl, uploading: false, uploadProgress: 0 }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const values = await Promise.all(BG_CONFIG.map((item) => getSiteSettingOptional(item.settingKey)));
        setItems((prev) =>
          prev.map((item, idx) => ({
            ...item,
            url: values[idx]?.trim() || item.fallbackUrl,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateItem = (id: string, partial: Partial<BackgroundItem>) => {
    if ('url' in partial) {
      setHasUnsavedChanges(true);
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  const handleFileUpload = async (id: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    updateItem(id, { uploading: true, uploadProgress: 0 });
    try {
      const rawUrl = await uploadToCloudinary(file, 'background-images', (percent) => {
        updateItem(id, { uploadProgress: percent });
      });
      const transformedUrl = rawUrl.replace('/upload/', '/upload/f_auto,q_auto,w_1920/');
      updateItem(id, { url: transformedUrl });
      toast.success('Uploaded to Cloudinary');
    } catch (error) {
      toast.error('Upload failed', { description: error instanceof Error ? error.message : 'Try again.' });
    } finally {
      updateItem(id, { uploading: false, uploadProgress: 0 });
    }
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        items.map((item) => upsertSiteSetting(item.settingKey, item.url, 'text'))
      );
      toast.success('Background image settings saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to save settings', { description: error instanceof Error ? error.message : 'Try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Background Images"
      subtitle="Upload background images to Cloudinary and save CDN URLs."
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="pb-20 md:pb-0">
          <div className="mb-4 text-sm text-muted-foreground">
            Upload images here to Cloudinary directly. URLs are stored in `site_settings` for centralized management.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{item.usage}</p>
                  <div className="rounded-lg overflow-hidden border bg-muted/20 h-36">
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`url-${item.id}`}>Cloudinary URL</Label>
                    <Input
                      id={`url-${item.id}`}
                      value={item.url}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`file-${item.id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted/40 text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      {item.uploading ? 'Uploading...' : 'Upload'}
                    </Label>
                    <Input
                      id={`file-${item.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(item.id, e.target.files?.[0] || null)}
                    />
                  </div>
                  {item.uploading && (
                    <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          Uploading...
                        </span>
                        <span className="font-medium">{item.uploadProgress}%</span>
                      </div>
                      <Progress value={item.uploadProgress} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 max-md:hidden">
            <Button onClick={saveAll} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All
            </Button>
          </div>
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur p-3">
            <Button onClick={saveAll} disabled={isSaving || !hasUnsavedChanges} className="w-full h-11">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved'}
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
