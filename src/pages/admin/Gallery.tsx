import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Star, Upload, Image as ImageIcon, X, Check, Loader2, Edit, Rows3 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  deleteGalleryRow,
  getGalleryCategories,
  GalleryImage,
} from '@/services/gallery';
import { getSiteSettingOptional, upsertSiteSetting } from '@/services/siteContent';
import { GALLERY_FRAME_TEMPLATES, type GalleryFrameTemplateId } from '@/lib/galleryFrames';
import { toast } from 'sonner';

const MIN_IMAGES_PER_ROW = 7;
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
  const [isAddToRowDialogOpen, setIsAddToRowDialogOpen] = useState(false);
  const [targetRowIndex, setTargetRowIndex] = useState(0);
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
  const [frameTemplate, setFrameTemplate] = useState<GalleryFrameTemplateId>('polaroid');
  const [savingFrame, setSavingFrame] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setSearchParams({}, { replace: true });
      setIsAddToRowDialogOpen(true);
      setUploadPreviews([]);
      setUploadFormData([]);
    }
  }, [searchParams.get('add'), setSearchParams]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const [galleryData, categoryData, frameVal] = await Promise.all([
        getAllGalleryImages(),
        getGalleryCategories(),
        getSiteSettingOptional('homepage_gallery_frame_template'),
      ]);
      setImages(galleryData);
      setCategories(['All', ...categoryData]);
      setFrameTemplate(
        frameVal && frameVal in GALLERY_FRAME_TEMPLATES ? (frameVal as GalleryFrameTemplateId) : 'polaroid'
      );
    } catch (error: unknown) {
      logger.error('Error loading gallery', error, { component: 'AdminGallery', action: 'loadGallery' });
      toast.error('Failed to load gallery', {
        description: (error as Error)?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const rows = (() => {
    const byRow: GalleryImage[][] = [];
    for (const img of images) {
      const ri = img.row_index ?? 0;
      while (byRow.length <= ri) byRow.push([]);
      byRow[ri].push(img);
    }
    return byRow;
  })();

  const rowCount = rows.length;
  const maxRowIndex = Math.max(0, ...images.map((i) => i.row_index ?? 0));

  const handleFrameTemplateChange = async (value: string) => {
    if (!(value in GALLERY_FRAME_TEMPLATES)) return;
    setSavingFrame(true);
    try {
      await upsertSiteSetting('homepage_gallery_frame_template', value);
      setFrameTemplate(value as GalleryFrameTemplateId);
      toast.success('Frame template updated');
    } catch (e: unknown) {
      toast.error('Failed to save', { description: (e as Error)?.message });
    } finally {
      setSavingFrame(false);
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

  const handleOpenAddToRow = (rowIndex?: number) => {
    setTargetRowIndex(rowIndex ?? maxRowIndex + 1);
    setUploadPreviews([]);
    setUploadFormData([]);
    setIsAddToRowDialogOpen(true);
  };

  const handleDeleteRow = async (rowIndex: number) => {
    const rowImages = rows[rowIndex] || [];
    const count = rowImages.length;
    if (
      !confirm(
        `Delete Row ${rowIndex + 1}? This will remove ${count} image${count !== 1 ? 's' : ''} and shift all subsequent rows down.`
      )
    ) {
      return;
    }
    try {
      setDeletingRowIndex(rowIndex);
      await deleteGalleryRow(rowIndex);
      setImages((prev) => {
        const deleted = prev.filter((i) => (i.row_index ?? 0) !== rowIndex);
        return deleted
          .map((i) => {
            const ri = i.row_index ?? 0;
            if (ri > rowIndex) {
              return { ...i, row_index: ri - 1 };
            }
            return i;
          })
          .sort((a, b) => {
            const ra = a.row_index ?? 0;
            const rb = b.row_index ?? 0;
            if (ra !== rb) return ra - rb;
            return (a.display_order ?? 0) - (b.display_order ?? 0);
          });
      });
      toast.success(`Row ${rowIndex + 1} deleted. Rows renumbered.`);
    } catch (e: unknown) {
      toast.error('Failed to delete row', { description: (e as Error)?.message });
    } finally {
      setDeletingRowIndex(null);
    }
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

  const handleConfirmAddToRow = async () => {
    if (uploadPreviews.length < MIN_IMAGES_PER_ROW) {
      toast.error(`Add at least ${MIN_IMAGES_PER_ROW} images to a row`);
      return;
    }

    const rowImages = images.filter((i) => (i.row_index ?? 0) === targetRowIndex);
    const maxO =
      rowImages.length > 0
        ? Math.max(...rowImages.map((img) => img.display_order ?? 0))
        : targetRowIndex * 100;

    const formDataArray = uploadPreviews.map((_, index) => {
      const existing = uploadFormData[index];
      return (
        existing || {
          title: `Image ${index + 1}`,
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
            row_index: targetRowIndex,
          })
        )
      );
      setImages([...newImages, ...images]);
      setUploadPreviews([]);
      setUploadFormData([]);
      setIsAddToRowDialogOpen(false);
      toast.success(`${newImages.length} image(s) added to Row ${targetRowIndex + 1}`);
    } catch (e: unknown) {
      toast.error('Failed to upload', { description: (e as Error)?.message });
    } finally {
      setIsUploading(false);
    }
  };

  const allCategories = [...new Set([...UPLOAD_CATEGORY_OPTIONS, ...categories.filter((c) => c !== 'All')])].sort();

  return (
    <AdminLayout title="Gallery" subtitle="Manage homepage gallery rows and images">
      {/* Frame template & row summary */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-sm font-medium">Frame template</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how images appear on the homepage
            </p>
          </div>
          <Select
            value={frameTemplate}
            onValueChange={handleFrameTemplateChange}
            disabled={savingFrame}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GALLERY_FRAME_TEMPLATES).map(([id, t]) => (
                <SelectItem key={id} value={id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Rows3 className="w-4 h-4" />
          <span>
            {rowCount} row{rowCount !== 1 ? 's' : ''} • {images.length} image{images.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

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
          <Button onClick={() => handleOpenAddToRow()} className="gap-2">
            <Upload className="w-4 h-4" />
            Add images to row
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

      {/* Rows */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : rowCount === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No rows yet</h3>
          <p className="text-muted-foreground mb-4">
            Add at least {MIN_IMAGES_PER_ROW} images to create your first row. You can add more than {MIN_IMAGES_PER_ROW} per row.
          </p>
          <Button onClick={() => handleOpenAddToRow(0)}>
            <Upload className="w-4 h-4 mr-2" />
            Add images to Row 1
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {rows.map((rowImages, idx) => {
            const rowIndex = idx;
            const filtered = searchQuery || filterCategory !== 'All'
              ? rowImages.filter((i) => {
                  const mSearch = (i.title || '').toLowerCase().includes(searchQuery.toLowerCase());
                  const mCat = filterCategory === 'All' || i.category === filterCategory;
                  return mSearch && mCat;
                })
              : rowImages;
            if (filtered.length === 0 && (searchQuery || filterCategory !== 'All')) return null;

            return (
              <motion.div
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    Row {rowIndex + 1}
                    <Badge variant="secondary">{rowImages.length} images</Badge>
                    {rowImages.length < MIN_IMAGES_PER_ROW && (
                      <Badge variant="destructive">Min {MIN_IMAGES_PER_ROW} required</Badge>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenAddToRow(rowIndex)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add images
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRow(rowIndex)}
                      disabled={deletingRowIndex !== null}
                    >
                      {deletingRowIndex === rowIndex ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Delete row
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {(searchQuery || filterCategory !== 'All' ? filtered : rowImages).map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <Card
                        className={`overflow-hidden transition-all ${
                          selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''
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
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                                selectedImages.has(image.id) ? 'bg-primary border-primary' : 'bg-white/80 border-gray-300'
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
                            <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                              Order: {image.display_order ?? 0}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Add new row */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => handleOpenAddToRow(maxRowIndex + 1)}>
              <Plus className="w-4 h-4 mr-2" />
              Create new row (Row {maxRowIndex + 2})
            </Button>
          </div>
        </div>
      )}

      {/* Add images to row dialog */}
      <Dialog open={isAddToRowDialogOpen} onOpenChange={setIsAddToRowDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add images to Row {targetRowIndex + 1}</DialogTitle>
            <DialogDescription>
              Add at least {MIN_IMAGES_PER_ROW} images. You can add more than {MIN_IMAGES_PER_ROW}. Set title, category, display order, and featured for each.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 mb-4">
            <Label>Target row</Label>
            <Select
              value={String(targetRowIndex)}
              onValueChange={(v) => setTargetRowIndex(parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxRowIndex + 2 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    Row {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="py-4 space-y-4">
            <ImageUpload
              value={uploadPreviews}
              onChange={(value) => {
                const urls = value as string[];
                setUploadPreviews(urls);
                setUploadFormData((prev) => {
                  const newData = [...prev];
                  const rowImgs = images.filter((i) => (i.row_index ?? 0) === targetRowIndex);
                  const maxO =
                    rowImgs.length > 0
                      ? Math.max(...rowImgs.map((i) => i.display_order ?? 0))
                      : targetRowIndex * 100;
                  while (newData.length < urls.length) {
                    newData.push({
                      title: `Image ${newData.length + 1}`,
                      category: 'Wedding',
                      display_order: maxO + 1 + newData.length,
                      is_featured: false,
                    });
                  }
                  return newData.slice(0, urls.length);
                });
              }}
              multiple
              maxFiles={50}
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
                          const newData = [...uploadFormData];
                          newData[index] = { ...(newData[index] || {}), title: e.target.value };
                          setUploadFormData(newData);
                        }}
                        placeholder={`Image ${index + 1}`}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={uploadFormData[index]?.category || 'Wedding'}
                        onValueChange={(v) => {
                          const newData = [...uploadFormData];
                          newData[index] = { ...(newData[index] || {}), category: v };
                          setUploadFormData(newData);
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
                          const newData = [...uploadFormData];
                          newData[index] = {
                            ...(newData[index] || {}),
                            display_order: parseInt(e.target.value, 10) || 0,
                          };
                          setUploadFormData(newData);
                        }}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Featured</Label>
                      <div className="flex items-center gap-2 h-9">
                        <Switch
                          checked={uploadFormData[index]?.is_featured ?? false}
                          onCheckedChange={(v) => {
                            const newData = [...uploadFormData];
                            newData[index] = { ...(newData[index] || {}), is_featured: v };
                            setUploadFormData(newData);
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
                setIsAddToRowDialogOpen(false);
                setUploadPreviews([]);
                setUploadFormData([]);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAddToRow}
              disabled={isUploading || uploadPreviews.length < MIN_IMAGES_PER_ROW}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Add ${uploadPreviews.length} to Row ${targetRowIndex + 1}`
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
