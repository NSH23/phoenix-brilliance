import { useEffect, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getAllSiteSettings, upsertSiteSetting } from '@/services/siteContent';

type BackgroundItem = {
  id: string;
  label: string;
  section: string;
  settingKey: string;
  usage: string;
  fallbackUrl: string;
  url: string;
  uploading: boolean;
  uploadProgress: number;
};

const DEFAULT_BG_BASE = '';

const BG_CONFIG: Array<Omit<BackgroundItem, 'url' | 'uploading' | 'uploadProgress'>> = [
  { id: 'home_hero', section: 'Homepage', label: 'Hero Background', settingKey: 'bg_image_home_hero', usage: 'Home hero wrapper background image', fallbackUrl: `${DEFAULT_BG_BASE}/9.jpg` },
  { id: 'home_venues', section: 'Homepage', label: 'Venues Section', settingKey: 'bg_image_home_venues', usage: 'Homepage venues/collaborations section', fallbackUrl: `${DEFAULT_BG_BASE}/3.jpg` },
  { id: 'home_events', section: 'Homepage', label: 'Events Section', settingKey: 'bg_image_home_events', usage: 'Homepage events section', fallbackUrl: `${DEFAULT_BG_BASE}/9.jpg` },
  { id: 'home_why_choose_us', section: 'Homepage', label: 'Why Choose Us Section', settingKey: 'bg_image_home_why_choose_us', usage: 'Homepage why-choose-us section', fallbackUrl: `${DEFAULT_BG_BASE}/5.jpg` },
  { id: 'services_light', section: 'Homepage', label: 'Services Light Background', settingKey: 'bg_image_7', usage: 'Homepage services (light mode)', fallbackUrl: `${DEFAULT_BG_BASE}/7.jpg` },
  { id: 'services_dark', section: 'Homepage', label: 'Services Dark Background', settingKey: 'bg_image_1_5', usage: 'Homepage services (dark mode)', fallbackUrl: `${DEFAULT_BG_BASE}/1.5.jpg` },
  { id: 'about_light', section: 'Homepage', label: 'About Light Background', settingKey: 'bg_image_9', usage: 'Homepage about (light mode)', fallbackUrl: `${DEFAULT_BG_BASE}/9.jpg` },
  { id: 'about_dark', section: 'Homepage', label: 'About Dark Background', settingKey: 'bg_image_bg12', usage: 'Homepage about (dark mode)', fallbackUrl: `${DEFAULT_BG_BASE}/bg12.jpg` },
  { id: 'events_dark_container', section: 'Homepage', label: 'Events Dark Container', settingKey: 'bg_image_bg2', usage: 'Homepage events container (dark mode)', fallbackUrl: `${DEFAULT_BG_BASE}/bg2.jpg` },
  { id: 'testimonials_light', section: 'Homepage', label: 'Testimonials Light Background', settingKey: 'bg_image_lgt4', usage: 'Homepage testimonials (light mode)', fallbackUrl: `${DEFAULT_BG_BASE}/lgt4.jpg` },
  { id: 'testimonials_dark', section: 'Homepage', label: 'Testimonials Dark Background', settingKey: 'bg_image_dt1', usage: 'Homepage testimonials (dark mode)', fallbackUrl: `${DEFAULT_BG_BASE}/dt1.jpg` },
  { id: 'events_page_hero_light', section: 'Events Page', label: 'Events Hero (Light)', settingKey: 'bg_image_events_page_hero', usage: 'Events page hero background in light mode', fallbackUrl: `${DEFAULT_BG_BASE}/9.jpg` },
  { id: 'events_page_hero_dark', section: 'Events Page', label: 'Events Hero (Dark)', settingKey: 'bg_image_events_page_hero_dark', usage: 'Events page hero background in dark mode', fallbackUrl: `${DEFAULT_BG_BASE}/bg2.jpg` },
  { id: 'services_page_hero_light', section: 'Services Page', label: 'Services Hero (Light)', settingKey: 'bg_image_services_page_hero', usage: 'Services page hero background in light mode', fallbackUrl: `${DEFAULT_BG_BASE}/7.jpg` },
  { id: 'services_page_hero_dark', section: 'Services Page', label: 'Services Hero (Dark)', settingKey: 'bg_image_services_page_hero_dark', usage: 'Services page hero background in dark mode', fallbackUrl: `${DEFAULT_BG_BASE}/1.5.jpg` },
  { id: 'gallery_page_hero_light', section: 'Gallery Page', label: 'Gallery Hero (Light)', settingKey: 'bg_image_gallery_page_hero', usage: 'Gallery page hero background in light mode', fallbackUrl: `${DEFAULT_BG_BASE}/3.jpg` },
  { id: 'gallery_page_hero_dark', section: 'Gallery Page', label: 'Gallery Hero (Dark)', settingKey: 'bg_image_gallery_page_hero_dark', usage: 'Gallery page hero background in dark mode', fallbackUrl: `${DEFAULT_BG_BASE}/bg12.jpg` },
  { id: 'collab_page_hero_light', section: 'Venues Page', label: 'Venues Hero (Light)', settingKey: 'bg_image_collaborations_page_hero', usage: 'Collaborations/Venues page hero in light mode', fallbackUrl: `${DEFAULT_BG_BASE}/3.jpg` },
  { id: 'collab_page_hero_dark', section: 'Venues Page', label: 'Venues Hero (Dark)', settingKey: 'bg_image_collaborations_page_hero_dark', usage: 'Collaborations/Venues page hero in dark mode', fallbackUrl: `${DEFAULT_BG_BASE}/bg12.jpg` },
];

const PRESET_KEYS = new Set(BG_CONFIG.map((item) => item.settingKey));

function settingKeyToCssVar(settingKey: string): string {
  return `--bg-image-${settingKey.replace(/^bg_image_/, '').replace(/_/g, '-')}`;
}

function settingKeyToLabel(settingKey: string): string {
  return settingKey
    .replace(/^bg_image_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeCustomKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function AdminBackgroundImages() {
  const [items, setItems] = useState<BackgroundItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [customSection, setCustomSection] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAllSiteSettings();
        const map = new Map<string, string>();
        settings.forEach((setting) => {
          const value = setting.value?.trim();
          if (value) map.set(setting.key, value);
        });

        const presetItems: BackgroundItem[] = BG_CONFIG.map((item) => ({
          ...item,
          url: map.get(item.settingKey) || item.fallbackUrl,
          uploading: false,
          uploadProgress: 0,
        }));

        const customItems: BackgroundItem[] = settings
          .filter((setting) => setting.key.startsWith('bg_image_') && !PRESET_KEYS.has(setting.key))
          .map((setting) => ({
            id: `custom-${setting.key}`,
            section: 'Custom',
            label: settingKeyToLabel(setting.key),
            settingKey: setting.key,
            usage: 'Custom background slot from site settings',
            fallbackUrl: '',
            url: setting.value?.trim() || '',
            uploading: false,
            uploadProgress: 0,
          }));

        setItems([...presetItems, ...customItems]);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateItem = (id: string, partial: Partial<BackgroundItem>) => {
    if ('url' in partial) setHasUnsavedChanges(true);
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

  const addCustomItem = () => {
    const normalized = normalizeCustomKey(customKey);
    if (!normalized) {
      toast.error('Please enter a valid custom key');
      return;
    }
    const settingKey = `bg_image_${normalized}`;
    if (items.some((item) => item.settingKey === settingKey)) {
      toast.error('This key already exists');
      return;
    }
    const next: BackgroundItem = {
      id: `custom-${settingKey}`,
      section: customSection.trim() || 'Custom',
      label: customLabel.trim() || settingKeyToLabel(settingKey),
      settingKey,
      usage: 'Custom background slot',
      fallbackUrl: '',
      url: customUrl.trim(),
      uploading: false,
      uploadProgress: 0,
    };
    setItems((prev) => [...prev, next]);
    setHasUnsavedChanges(true);
    setCustomSection('');
    setCustomLabel('');
    setCustomKey('');
    setCustomUrl('');
    toast.success('Custom slot added');
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(items.map((item) => upsertSiteSetting(item.settingKey, item.url, 'text')));
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

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Add Custom Background Slot</CardTitle>
              <p className="text-xs text-muted-foreground">
                Add future sections without code changes. Key saves as `bg_image_your_key`.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Section (e.g. Blog Page)"
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                />
                <Input
                  placeholder="Label (e.g. Blog Hero)"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
                <Input
                  placeholder="Custom key (e.g. blog_page_hero)"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                />
                <Input
                  placeholder="Initial URL (optional)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>
              <Button type="button" onClick={addCustomItem}>Add Slot</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{item.section}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{item.usage}</p>
                  <p className="text-xs text-muted-foreground">
                    CSS var: <code>{settingKeyToCssVar(item.settingKey)}</code>
                  </p>
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
