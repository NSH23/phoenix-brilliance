import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [aboutFront, setAboutFront] = useState<string[]>(() => Array(4).fill(''));
  const [aboutBack, setAboutBack] = useState<string[]>(() => Array(4).fill(''));
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
        const front = [...aboutSection.front.slice(0, 4)];
        while (front.length < 4) front.push('');
        const back = [...aboutSection.back.slice(0, 4)];
        while (back.length < 4) back.push('');
        setAboutFront(front);
        setAboutBack(back);
      } else {
        setAboutFront(Array(4).fill(''));
        setAboutBack(Array(4).fill(''));
      }
    } catch (error: unknown) {
      logger.error('Error loading about section', error, { component: 'AdminGallery', action: 'loadAboutSection' });
      toast.error('Failed to load', { description: (error as Error)?.message || 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const persistAboutFlipToServer = async (nextFront: string[], nextBack: string[]) => {
    setAboutSectionSaving(true);
    try {
      await upsertAboutSectionFlipImages({ front: nextFront, back: nextBack });
      await queryClient.invalidateQueries({ queryKey: ['homepage-data'] });
    } finally {
      setAboutSectionSaving(false);
    }
  };

  const handleSaveAboutSection = async () => {
    try {
      await persistAboutFlipToServer(aboutFront, aboutBack);
      toast.success('About Us 3D section saved');
    } catch (e: unknown) {
      toast.error('Failed to save', { description: (e as Error)?.message });
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
    <AdminLayout title="About Us 3D Section" subtitle="Set 4 front and 4 back images for the About section on the homepage">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg">About Us 3D Flip Cards</h3>
            <p className="text-sm text-muted-foreground">
              Upload 4 front and 4 back images for the homepage About block. Each upload saves to the site automatically; you can also use Save to persist any pending changes.
            </p>
          </div>
          <Button onClick={handleSaveAboutSection} disabled={aboutSectionSaving}>
            {aboutSectionSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save About Section
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium mb-2 block max-md:text-lg max-md:font-semibold max-md:mb-3">Front (4 cards)</Label>
            <div className="grid grid-cols-2 gap-3">
              {aboutFront.map((url, i) => (
                <div key={`f-${i}`} className="space-y-1">
                  <div className="aspect-square rounded-lg border bg-muted overflow-hidden max-md:min-h-[120px]">
                    {url ? (
                      <img src={url} alt={`Front ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => (e.currentTarget.src = '')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Slot {i + 1}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-md:flex max-md:flex-col max-md:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setAboutUploadSlot({ side: 'front', index: i })}
                    >
                      Select
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={!url}
                      onClick={() => {
                        void (async () => {
                          const nextFront = aboutFront.map((u, j) => (j === i ? '' : u));
                          setAboutFront(nextFront);
                          try {
                            await persistAboutFlipToServer(nextFront, aboutBack);
                            toast.success('Slot cleared');
                          } catch (e: unknown) {
                            toast.error('Failed to save', { description: (e as Error)?.message });
                          }
                        })();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden h-px bg-border/60" />
          <div>
            <Label className="text-sm font-medium mb-2 block max-md:text-lg max-md:font-semibold max-md:mb-3">Back (4 cards)</Label>
            <div className="grid grid-cols-2 gap-3">
              {aboutBack.map((url, i) => (
                <div key={`b-${i}`} className="space-y-1">
                  <div className="aspect-square rounded-lg border bg-muted overflow-hidden max-md:min-h-[120px]">
                    {url ? (
                      <img src={url} alt={`Back ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => (e.currentTarget.src = '')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Slot {i + 1}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-md:flex max-md:flex-col max-md:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setAboutUploadSlot({ side: 'back', index: i })}
                    >
                      Select
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={!url}
                      onClick={() => {
                        void (async () => {
                          const nextBack = aboutBack.map((u, j) => (j === i ? '' : u));
                          setAboutBack(nextBack);
                          try {
                            await persistAboutFlipToServer(aboutFront, nextBack);
                            toast.success('Slot cleared');
                          } catch (e: unknown) {
                            toast.error('Failed to save', { description: (e as Error)?.message });
                          }
                        })();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Upload for one slot */}
      <Dialog open={!!aboutUploadSlot} onOpenChange={(open) => !open && setAboutUploadSlot(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto max-md:w-[95vw]">
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
                  const { side, index } = aboutUploadSlot;
                  const nextFront =
                    side === 'front' ? aboutFront.map((u, j) => (j === index ? url : u)) : [...aboutFront];
                  const nextBack =
                    side === 'back' ? aboutBack.map((u, j) => (j === index ? url : u)) : [...aboutBack];
                  setAboutFront(nextFront);
                  setAboutBack(nextBack);
                  setAboutUploadSlot(null);
                  void (async () => {
                    try {
                      await persistAboutFlipToServer(nextFront, nextBack);
                      toast.success('Image saved — homepage About cards will show this photo');
                    } catch (e: unknown) {
                      toast.error('Failed to save', { description: (e as Error)?.message });
                    }
                  })();
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
