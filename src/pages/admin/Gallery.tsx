import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getAboutSectionFlipImagesOptional, upsertAboutSectionFlipImages } from '@/services/siteContent';
import { toast } from 'sonner';

export default function AdminGallery() {
  const [aboutFront, setAboutFront] = useState<string[]>(() => Array(6).fill(''));
  const [aboutBack, setAboutBack] = useState<string[]>(() => Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(true);
  const [aboutSectionSaving, setAboutSectionSaving] = useState(false);
  const [aboutUploadSlot, setAboutUploadSlot] = useState<{ side: 'front' | 'back'; index: number } | null>(null);

  useEffect(() => {
    loadAboutSection();
  }, []);

  const loadAboutSection = async () => {
    try {
      setIsLoading(true);
      const aboutSection = await getAboutSectionFlipImagesOptional();
      if (aboutSection) {
        const front = [...aboutSection.front.slice(0, 6)];
        while (front.length < 6) front.push('');
        const back = [...aboutSection.back.slice(0, 6)];
        while (back.length < 6) back.push('');
        setAboutFront(front);
        setAboutBack(back);
      }
    } catch (error: unknown) {
      logger.error('Error loading about section', error, { component: 'AdminGallery', action: 'loadAboutSection' });
      toast.error('Failed to load', { description: (error as Error)?.message || 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAboutSection = async () => {
    try {
      setAboutSectionSaving(true);
      await upsertAboutSectionFlipImages({ front: aboutFront, back: aboutBack });
      toast.success('About Us 3D section saved');
    } catch (e: unknown) {
      toast.error('Failed to save', { description: (e as Error)?.message });
    } finally {
      setAboutSectionSaving(false);
    }
  };

  const setAboutSlotUrl = (side: 'front' | 'back', index: number, url: string) => {
    if (side === 'front') setAboutFront((prev) => { const n = [...prev]; n[index] = url; return n; });
    else setAboutBack((prev) => { const n = [...prev]; n[index] = url; return n; });
  };

  if (isLoading) {
    return (
      <AdminLayout title="About Us 3D Section" subtitle="Manage images for the About section flip cards">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="About Us 3D Section" subtitle="Set 6 front and 6 back images for the About section on the homepage">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg">About Us 3D Flip Cards</h3>
            <p className="text-sm text-muted-foreground">Upload 6 front and 6 back images. They appear in the About section on the homepage.</p>
          </div>
          <Button onClick={handleSaveAboutSection} disabled={aboutSectionSaving}>
            {aboutSectionSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save About Section
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Front (6 cards)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {aboutFront.map((url, i) => (
                <div key={`f-${i}`} className="space-y-1">
                  <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                    {url ? (
                      <img src={url} alt={`Front ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => (e.currentTarget.src = '')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Slot {i + 1}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setAboutUploadSlot({ side: 'front', index: i })}
                  >
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Back (6 cards)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {aboutBack.map((url, i) => (
                <div key={`b-${i}`} className="space-y-1">
                  <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                    {url ? (
                      <img src={url} alt={`Back ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => (e.currentTarget.src = '')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Slot {i + 1}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setAboutUploadSlot({ side: 'back', index: i })}
                  >
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Upload for one slot */}
      <Dialog open={!!aboutUploadSlot} onOpenChange={(open) => !open && setAboutUploadSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload image</DialogTitle>
            <DialogDescription>
              {aboutUploadSlot ? `Upload for ${aboutUploadSlot.side} card ${aboutUploadSlot.index + 1}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ImageUpload
              value={aboutUploadSlot ? (aboutUploadSlot.side === 'front' ? aboutFront[aboutUploadSlot.index] : aboutBack[aboutUploadSlot.index]) : ''}
              onChange={(value) => {
                const url = typeof value === 'string' ? value : (Array.isArray(value) ? value[0] : '');
                if (url && aboutUploadSlot) {
                  setAboutSlotUrl(aboutUploadSlot.side, aboutUploadSlot.index, url);
                  setAboutUploadSlot(null);
                }
              }}
              bucket="gallery-images"
              uploadOnSelect={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
