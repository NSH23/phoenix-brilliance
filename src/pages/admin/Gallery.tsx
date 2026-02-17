import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Star, Upload, Image as ImageIcon, X, Check, Loader2, Edit, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  getAllGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  deleteGalleryImages,
  getGalleryCategories,
  GalleryImage,
} from '@/services/gallery';
import { toast } from 'sonner';

const MAX_IMAGES = 12;
const UPLOAD_CATEGORY_OPTIONS = ['Wedding', 'Engagement', 'Birthday', 'Corporate', 'Mehndi', 'Sangeet', 'Haldi', 'Other'];

export default function AdminGallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploadFormData, setUploadFormData] = useState<
    { title: string; category: string; display_order: number; is_featured: boolean }[]
  >([]);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'Wedding',
    display_order: 0,
    is_featured: false,
  });

  useEffect(() => {
    loadGallery();
  }, []);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      if (images.length < MAX_IMAGES) {
        setIsUploadDialogOpen(true);
        setUploadPreviews([]);
        setUploadFormData([]);
      } else {
        toast.error('Maximum Global Limit Reached', {
          description: `You cannot upload more than ${MAX_IMAGES} images. Please delete some images first.`
        });
      }
    }
  }, [searchParams.get('add'), setSearchParams, images.length]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const [galleryData, categoryData] = await Promise.all([
        getAllGalleryImages(),
        getGalleryCategories(),
      ]);
      setImages(galleryData);
      setCategories(['All', ...categoryData]);
    } catch (error: unknown) {
      logger.error('Error loading gallery', error, { component: 'AdminGallery', action: 'loadGallery' });
      toast.error('Failed to load gallery', {
        description: (error as Error)?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredImages = images.filter((image) => {
    const matchesSearch = (image.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || image.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectImage = (id: string) => {
    const next = new Set(selectedImages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedImages(next);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) setSelectedImages(new Set());
    else setSelectedImages(new Set(filteredImages.map((i) => i.id)));
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Delete ${selectedImages.size} image(s)?`)) return;
    try {
      const ids = Array.from(selectedImages);
      if (ids.length === 1) await deleteGalleryImage(ids[0]);
      else await deleteGalleryImages(ids);
      setImages(images.filter((i) => !selectedImages.has(i.id)));
      toast.success(`${selectedImages.size} image(s) deleted`);
      setSelectedImages(new Set());
    } catch (e: unknown) {
      toast.error('Failed to delete', { description: (e as Error)?.message });
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    try {
      const updated = await updateGalleryImage(id, { is_featured: !img.is_featured });
      setImages(images.map((i) => (i.id === id ? updated : i)));
      toast.success(updated.is_featured ? 'Featured' : 'Unfeatured');
    } catch (e: unknown) {
      toast.error('Failed to update', { description: (e as Error)?.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      await deleteGalleryImage(id);
      setImages(images.filter((i) => i.id !== id));
      toast.success('Image deleted');
    } catch (e: unknown) {
      toast.error('Failed to delete', { description: (e as Error)?.message });
    }
  };

  const handleOpenUpload = () => {
    setUploadPreviews([]);
    setUploadFormData([]);
    setIsUploadDialogOpen(true);
  };

  const handleOpenEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setEditFormData({
      title: image.title || '',
      category: image.category || 'Wedding',
      display_order: image.display_order ?? 0,
      is_featured: image.is_featured ?? false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;
    try {
      const updated = await updateGalleryImage(editingImage.id, {
        title: editFormData.title || null,
        category: editFormData.category || null,
        display_order: editFormData.display_order,
        is_featured: editFormData.is_featured,
      });
      setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditingImage(null);
      toast.success('Image updated');
    } catch (e: unknown) {
      toast.error('Failed to update', { description: (e as Error)?.message });
    }
  };

  const handleUpload = async () => {
    const totalAfterUpload = images.length + uploadPreviews.length;
    if (totalAfterUpload > MAX_IMAGES) {
      toast.error('Limit Exceeded', {
        description: `You can only upload ${MAX_IMAGES - images.length} more image(s).`
      });
      return;
    }

    const maxO = images.length > 0 ? Math.max(...images.map(i => i.display_order || 0)) : 0;

    const formDataArray = uploadPreviews.map((_, index) => {
      const existing = uploadFormData[index];
      return (
        existing || {
          title: `Image ${images.length + index + 1}`,
          category: 'Wedding',
          display_order: maxO + 1 + index,
          is_featured: false,
        }
      );
    });

    try {
      setIsUploading(true);
      const newImages = await Promise.all(
        uploadPreviews.map((url, index) =>
          createGalleryImage({
            url,
            title: formDataArray[index].title,
            category: formDataArray[index].category,
            is_featured: formDataArray[index].is_featured,
            display_order: formDataArray[index].display_order,
            row_index: 0, // Default to 0 as rows are removed from UI
          })
        )
      );
      setImages([...newImages, ...images]);
      setUploadPreviews([]);
      setUploadFormData([]);
      setIsUploadDialogOpen(false);
      toast.success(`${newImages.length} image(s) uploaded`);
    } catch (e: unknown) {
      toast.error('Failed to upload', { description: (e as Error)?.message });
    } finally {
      setIsUploading(false);
    }
  };

  const allCategories = [...new Set([...UPLOAD_CATEGORY_OPTIONS, ...categories.filter((c) => c !== 'All')])].sort();

  return (
    <AdminLayout title="Gallery" subtitle="Manage homepage gallery images">
      {/* Stats */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={images.length === MAX_IMAGES ? "default" : "secondary"} className="text-sm px-3 py-1">
          {images.length} / {MAX_IMAGES} Images Uploaded
        </Badge>
        {images.length === MAX_IMAGES && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald" /> Maximum limit reached
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleOpenUpload}
            className="gap-2"
            disabled={images.length >= MAX_IMAGES}
          >
            <Upload className="w-4 h-4" />
            Add Images
          </Button>
        </div>

        {selectedImages.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-3 bg-muted rounded-lg"
          >
            <Checkbox
              checked={selectedImages.size === filteredImages.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">{selectedImages.size} selected</span>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedImages(new Set())}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </motion.div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No images yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload images to be displayed in the gallery. Maximum {MAX_IMAGES} images allowed.
          </p>
          <Button onClick={handleOpenUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredImages.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <Card
                className={`overflow-hidden transition-all ${selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''
                  }`}
              >
                <div className="relative aspect-square">
                  <img
                    src={image.url || '/placeholder.svg'}
                    alt={image.title || 'Gallery'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(image)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleToggleFeatured(image.id)}
                      >
                        <Star
                          className={`w-4 h-4 ${image.is_featured ? 'fill-primary text-primary' : ''}`}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <div
                      onClick={() => handleSelectImage(image.id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${selectedImages.has(image.id) ? 'bg-primary border-primary' : 'bg-white/80 border-gray-300'
                        }`}
                    >
                      {selectedImages.has(image.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  {image.is_featured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="gap-1 bg-primary/90">
                        <Star className="w-3 h-3 fill-current" />
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                    {image.category && (
                      <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                        {image.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Upload images to the gallery. {MAX_IMAGES - images.length} remaining slots.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <ImageUpload
              value={uploadPreviews}
              onChange={(value) => {
                const urls = value as string[];
                if (images.length + urls.length > MAX_IMAGES) {
                  toast.error("Limit exceeded", { description: `You can select max ${MAX_IMAGES - images.length} more images.` });
                  return;
                }
                setUploadPreviews(urls);
                setUploadFormData((prev) => {
                  const newData = [...prev];
                  const maxO = images.length > 0 ? Math.max(...images.map(i => i.display_order || 0)) : 0;
                  while (newData.length < urls.length) {
                    newData.push({
                      title: `Image ${images.length + newData.length + 1}`,
                      category: 'Wedding',
                      display_order: maxO + 1 + newData.length,
                      is_featured: false,
                    });
                  }
                  return newData.slice(0, urls.length);
                });
              }}
              multiple
              maxFiles={MAX_IMAGES - images.length}
              previewClassName="object-cover"
              bucket="gallery-images"
              uploadOnSelect
            />

            {uploadPreviews.length > 0 && (
              <div className="space-y-3">
                <Label>Image details</Label>
                {uploadPreviews.map((_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded-lg"
                  >
                    <div className="grid gap-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={uploadFormData[index]?.title || ''}
                        onChange={(e) => {
                          setUploadFormData((prev) => {
                            const newData = [...prev];
                            const current = newData[index] || {
                              title: '',
                              category: 'Wedding',
                              display_order: 0,
                              is_featured: false,
                            };
                            newData[index] = { ...current, title: e.target.value };
                            return newData;
                          });
                        }}
                        placeholder={`Image ${index + 1}`}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={uploadFormData[index]?.category || 'Wedding'}
                        onValueChange={(v) => {
                          setUploadFormData((prev) => {
                            const newData = [...prev];
                            const current = newData[index] || {
                              title: '',
                              category: 'Wedding',
                              display_order: 0,
                              is_featured: false,
                            };
                            newData[index] = { ...current, category: v };
                            return newData;
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" position="popper">
                          {allCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Display order</Label>
                      <Input
                        type="number"
                        min={0}
                        value={uploadFormData[index]?.display_order ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setUploadFormData((prev) => {
                            const newData = [...prev];
                            const current = newData[index] || {
                              title: '',
                              category: 'Wedding',
                              display_order: 0,
                              is_featured: false,
                            };
                            newData[index] = { ...current, display_order: val };
                            return newData;
                          });
                        }}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Featured</Label>
                      <div className="flex items-center gap-2 h-9">
                        <Switch
                          checked={uploadFormData[index]?.is_featured ?? false}
                          onCheckedChange={(v) => {
                            setUploadFormData((prev) => {
                              const newData = [...prev];
                              const current = newData[index] || {
                                title: '',
                                category: 'Wedding',
                                display_order: 0,
                                is_featured: false,
                              };
                              newData[index] = { ...current, is_featured: v };
                              return newData;
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setUploadPreviews([]);
                setUploadFormData([]);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploadPreviews.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${uploadPreviews.length} Images`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingImage} onOpenChange={(o) => !o && setEditingImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit image</DialogTitle>
            <DialogDescription>Update title, category, display order, featured.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData((f) => ({ ...f, title: e.target.value }))}
                placeholder="Image title"
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={editFormData.category}
                onValueChange={(v) => setEditFormData((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper">
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Display order</Label>
              <Input
                type="number"
                min={0}
                value={editFormData.display_order}
                onChange={(e) =>
                  setEditFormData((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Featured</Label>
              <Switch
                checked={editFormData.is_featured}
                onCheckedChange={(v) => setEditFormData((f) => ({ ...f, is_featured: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingImage(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
