import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Star, Upload, Image, X, Check, Grid, List, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
  isFeatured: boolean;
  uploadedAt: string;
}

const categories = ['All', 'Wedding', 'Birthday', 'Corporate', 'Engagement', 'Haldi', 'Mehendi', 'Sangeet'];

const initialImages: GalleryImage[] = [
  { id: '1', url: '/wedding 1.jpg', title: 'Grand Wedding', category: 'Wedding', isFeatured: true, uploadedAt: '2024-01-15' },
  { id: '2', url: '/gallery wedding.jpg', title: 'Wedding Ceremony', category: 'Wedding', isFeatured: false, uploadedAt: '2024-01-14' },
  { id: '3', url: '/birthday.jpg', title: 'Birthday Party', category: 'Birthday', isFeatured: true, uploadedAt: '2024-01-13' },
  { id: '4', url: '/coprate.jpg', title: 'Corporate Event', category: 'Corporate', isFeatured: false, uploadedAt: '2024-01-12' },
  { id: '5', url: '/engagement.jpg', title: 'Engagement', category: 'Engagement', isFeatured: true, uploadedAt: '2024-01-11' },
  { id: '6', url: '/haldi.jpg', title: 'Haldi Ceremony', category: 'Haldi', isFeatured: false, uploadedAt: '2024-01-10' },
  { id: '7', url: '/mehendi.jpg', title: 'Mehendi Night', category: 'Mehendi', isFeatured: false, uploadedAt: '2024-01-09' },
  { id: '8', url: '/sangeet.jpg', title: 'Sangeet', category: 'Sangeet', isFeatured: false, uploadedAt: '2024-01-08' },
  { id: '9', url: '/anniversary.jpg', title: 'Anniversary', category: 'Wedding', isFeatured: false, uploadedAt: '2024-01-07' },
];

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredImages = images.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || image.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectImage = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(i => i.id)));
    }
  };

  const handleDeleteSelected = () => {
    setImages(images.filter(i => !selectedImages.has(i.id)));
    toast.success(`${selectedImages.size} images deleted`);
    setSelectedImages(new Set());
  };

  const handleToggleFeatured = (id: string) => {
    setImages(images.map(i => 
      i.id === id ? { ...i, isFeatured: !i.isFeatured } : i
    ));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
        const newImages: GalleryImage[] = Array.from(files).map((file, index) => ({
          id: String(Date.now() + index),
          url: URL.createObjectURL(file),
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: 'Wedding',
          isFeatured: false,
          uploadedAt: new Date().toISOString().split('T')[0],
        }));
        setImages([...newImages, ...images]);
        setIsUploading(false);
        toast.success(`${files.length} images uploaded successfully`);
      }, 1500);
    }
  };

  return (
    <AdminLayout title="Gallery" subtitle="Manage your gallery images">
      {/* Actions Bar */}
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
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handleUploadClick} disabled={isUploading} className="gap-2">
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Images
              </>
            )}
          </Button>
        </div>

        {/* Selection Actions */}
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
              Clear Selection
            </Button>
          </motion.div>
        )}
      </div>

      {/* Images Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="relative group"
            >
              <Card className={`overflow-hidden transition-all ${
                selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''
              }`}>
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleToggleFeatured(image.id)}
                      >
                        <Star className={`w-4 h-4 ${image.isFeatured ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => {
                          setImages(images.filter(i => i.id !== image.id));
                          toast.success('Image deleted');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <div
                      onClick={() => handleSelectImage(image.id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                        selectedImages.has(image.id)
                          ? 'bg-primary border-primary'
                          : 'bg-white/80 border-gray-300 group-hover:border-primary'
                      }`}
                    >
                      {selectedImages.has(image.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {image.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="gap-1 bg-primary/90">
                        <Star className="w-3 h-3 fill-current" />
                      </Badge>
                    </div>
                  )}

                  {/* Category */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                      {image.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className={`transition-all ${selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-3 flex items-center gap-4">
                  <div
                    onClick={() => handleSelectImage(image.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
                      selectedImages.has(image.id)
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300 hover:border-primary'
                    }`}
                  >
                    {selectedImages.has(image.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{image.title}</h4>
                    <p className="text-sm text-muted-foreground">{image.category}</p>
                  </div>
                  <Badge variant={image.isFeatured ? 'default' : 'secondary'}>
                    {image.isFeatured ? 'Featured' : 'Normal'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleFeatured(image.id)}
                    >
                      <Star className={`w-4 h-4 ${image.isFeatured ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        setImages(images.filter(i => i.id !== image.id));
                        toast.success('Image deleted');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No images found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterCategory !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Upload your first images to get started'}
          </p>
          <Button onClick={handleUploadClick}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Images
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
