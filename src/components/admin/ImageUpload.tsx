import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { uploadToCloudinary, type BucketName } from '@/lib/cloudinary';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  enableBulkDelete?: boolean;
  maxFiles?: number;
  accept?: string;
  className?: string;
  label?: string;
  previewClassName?: string;
  previewWrapperClassName?: string;
  bucket?: BucketName; // Supabase storage bucket name
  uploadOnSelect?: boolean; // If true, upload immediately on file select
  enableCropAdjust?: boolean; // If true and single image, allow mobile-friendly crop before upload
  cropAspect?: number; // Crop frame ratio, defaults to 16/9
}

type Point = { x: number; y: number };
const MIN_CROP_ZOOM = 0.5;
const MAX_CROP_ZOOM = 3;
const DEFAULT_CROP_ZOOM = 1;

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImageBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to prepare image crop.');
  canvas.width = Math.max(1, Math.floor(pixelCrop.width));
  canvas.height = Math.max(1, Math.floor(pixelCrop.height));
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to generate cropped image.'));
      else resolve(blob);
    }, 'image/jpeg', 0.92);
  });
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  enableBulkDelete,
  maxFiles = 10,
  accept = 'image/*',
  className,
  label,
  previewClassName,
  previewWrapperClassName,
  bucket,
  uploadOnSelect = false,
  enableCropAdjust = false,
  cropAspect = 16 / 9,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<File[]>([]); // Store File objects for upload (can't attach to string)
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropOriginalFile, setCropOriginalFile] = useState<File | null>(null);
  const [cropFileName, setCropFileName] = useState<string>('cover.jpg');
  const [cropPosition, setCropPosition] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(DEFAULT_CROP_ZOOM);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);

  const images = Array.isArray(value) ? value : value ? [value] : [];
  const isBulkDeleteEnabled = multiple && enableBulkDelete !== false;
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Clear selection whenever the underlying set of items changes.
    setSelectedIndexes(new Set());
  }, [images.length, previews.length, multiple]);

  const fileMatchesAccept = (file: File): boolean => {
    if (!accept || accept === '*/*') return true;
    return accept.split(',').some((token) => {
      const t = token.trim().toLowerCase();
      if (!t) return false;
      if (t.endsWith('/*')) return file.type.toLowerCase().startsWith(t.slice(0, -1));
      return file.type.toLowerCase() === t;
    });
  };

  const uploadFilesWithProgress = useCallback(
    async (files: File[], targetBucket: BucketName): Promise<string[]> => {
      const totalFiles = files.length;
      const urls: string[] = [];
      for (let i = 0; i < totalFiles; i++) {
        const url = await uploadToCloudinary(files[i], targetBucket, (filePercent) => {
          const overall = Math.round(((i + filePercent / 100) / totalFiles) * 100);
          setUploadPercent(overall);
        });
        urls.push(url);
      }
      setUploadPercent(100);
      return urls;
    },
    []
  );

  const closeCropDialog = useCallback(() => {
    setIsCropOpen(false);
    if (cropSource?.startsWith('blob:')) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource(null);
    setCropOriginalFile(null);
    setCroppedPixels(null);
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(DEFAULT_CROP_ZOOM);
  }, [cropSource]);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  const uploadCroppedImage = useCallback(async () => {
    if (!bucket || !cropSource || !croppedPixels) {
      toast.error('Crop details are missing. Please try again.');
      return;
    }
    setIsUploading(true);
    setUploadPercent(0);
    try {
      const blob = await getCroppedImageBlob(cropSource, croppedPixels);
      const file = new File([blob], cropFileName || 'cover.jpg', { type: 'image/jpeg' });
      const url = await uploadToCloudinary(file, bucket, setUploadPercent);
      onChange(url);
      toast.success('Image adjusted and uploaded successfully');
      closeCropDialog();
    } catch (error) {
      logger.error('Crop upload error', error, { component: 'ImageUpload', action: 'uploadCroppedImage', bucket });
      toast.error('Failed to upload cropped image. Please try again.');
    } finally {
      setUploadPercent(0);
      setIsUploading(false);
    }
  }, [bucket, cropSource, croppedPixels, cropFileName, onChange, closeCropDialog]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).slice(0, multiple ? maxFiles - images.length : 1);
    const validFiles = fileArray.filter(fileMatchesAccept);
    
    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    // If bucket is provided and uploadOnSelect is true, upload immediately
    if (bucket && uploadOnSelect) {
      if (!multiple && enableCropAdjust && validFiles.length > 0) {
        const firstFile = validFiles[0];
        const localUrl = URL.createObjectURL(firstFile);
        setCropSource(localUrl);
        setCropOriginalFile(firstFile);
        setCropFileName(firstFile.name || 'cover.jpg');
        setCropPosition({ x: 0, y: 0 });
        setCropZoom(DEFAULT_CROP_ZOOM);
        setCroppedPixels(null);
        setIsCropOpen(true);
        return;
      }
      setIsUploading(true);
      setUploadPercent(0);
      try {
        if (multiple) {
          const urls = await uploadFilesWithProgress(validFiles, bucket);
          onChange([...images, ...urls]);
          toast.success(`${urls.length} image(s) uploaded successfully`);
        } else {
          const url = await uploadToCloudinary(validFiles[0], bucket, setUploadPercent);
          onChange(url);
          toast.success('Image uploaded successfully');
        }
      } catch (error) {
        logger.error('Upload error', error, { component: 'ImageUpload', action: 'handleFileSelect', bucket });
        const message = error instanceof Error ? error.message : 'Failed to upload image(s). Please try again.';
        toast.error('Upload failed', { description: message });
      } finally {
        setUploadPercent(0);
        setIsUploading(false);
      }
      return;
    }

    // Otherwise, create local previews (store Files in ref; can't attach to string)
    const newPreviews: string[] = new Array(validFiles.length);
    let loadedCount = 0;

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPreviews[index] = result;
        loadedCount++;

        if (loadedCount === validFiles.length) {
          const filled = newPreviews.filter((p): p is string => !!p);
          if (multiple) {
            const remainingSlots = maxFiles - images.length;
            const previewsToAdd = filled.slice(0, remainingSlots);
            pendingFilesRef.current = validFiles.slice(0, remainingSlots);
            setPreviews(previewsToAdd);
            onChange([...images, ...previewsToAdd]);
          } else {
            pendingFilesRef.current = [validFiles[0]];
            setPreviews(filled.slice(0, 1));
            onChange(filled[0]);
          }
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === validFiles.length) {
          const filled = newPreviews.filter((p): p is string => !!p);
          const filesForFilled = validFiles.filter((_, i) => newPreviews[i] != null);
          if (multiple) {
            const remainingSlots = maxFiles - images.length;
            const previewsToAdd = filled.slice(0, remainingSlots);
            pendingFilesRef.current = filesForFilled.slice(0, remainingSlots);
            setPreviews(previewsToAdd);
            onChange([...images, ...previewsToAdd]);
          } else {
            if (filled.length > 0) {
              pendingFilesRef.current = filesForFilled.slice(0, 1);
              setPreviews(filled.slice(0, 1));
              onChange(filled[0]);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images, multiple, maxFiles, onChange, bucket, uploadOnSelect, uploadFilesWithProgress, enableCropAdjust]);

  const uploadOriginalImage = useCallback(async () => {
    if (!bucket || !cropOriginalFile) {
      toast.error('Original image is missing. Please reselect and try again.');
      return;
    }
    setIsUploading(true);
    setUploadPercent(0);
    try {
      const url = await uploadToCloudinary(cropOriginalFile, bucket, setUploadPercent);
      onChange(url);
      toast.success('Image uploaded successfully');
      closeCropDialog();
    } catch (error) {
      logger.error('Original upload error', error, { component: 'ImageUpload', action: 'uploadOriginalImage', bucket });
      const message = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      toast.error('Upload failed', { description: message });
    } finally {
      setUploadPercent(0);
      setIsUploading(false);
    }
  }, [bucket, cropOriginalFile, onChange, closeCropDialog]);

  const openAdjustDialogForExisting = useCallback(() => {
    if (!enableCropAdjust || multiple || !images[0]) return;
    setCropSource(images[0]);
    setCropOriginalFile(null);
    setCropFileName('adjusted-image.jpg');
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(DEFAULT_CROP_ZOOM);
    setCroppedPixels(null);
    setIsCropOpen(true);
  }, [enableCropAdjust, multiple, images]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (index: number) => {
    if (!window.confirm('Delete this image?')) return;
    if (index < images.length) {
      // Removing an existing image
      if (multiple) {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
      } else {
        onChange('');
      }
    } else {
      // Removing a preview
      const previewIndex = index - images.length;
      const newPreviews = previews.filter((_, i) => i !== previewIndex);
      pendingFilesRef.current = pendingFilesRef.current.filter((_, i) => i !== previewIndex);
      setPreviews(newPreviews);
      if (multiple) {
        onChange(images);
      } else {
        onChange('');
        pendingFilesRef.current = [];
      }
    }

    // If the user removed something manually, clear bulk selection state.
    setSelectedIndexes(new Set());
  };

  const toggleSelectedIndex = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const deleteSelected = () => {
    const count = selectedIndexes.size;
    if (!count) return;
    if (!window.confirm(`Delete ${count} selected image(s)? This will remove them from the current form.`)) return;

    const newImages = images.filter((_, i) => !selectedIndexes.has(i));
    const newPreviews = previews.filter((_, i) => !selectedIndexes.has(images.length + i));

    pendingFilesRef.current = pendingFilesRef.current.filter(
      (_, i) => !selectedIndexes.has(images.length + i)
    );

    setPreviews(newPreviews);
    setSelectedIndexes(new Set());
    onChange(multiple ? newImages : '');
    toast.success(`${count} image(s) deleted`);
  };

  // Manual upload function (when uploadOnSelect is false)
  const handleUpload = async () => {
    if (!bucket) {
      toast.error('No storage bucket configured');
      return;
    }

    setIsUploading(true);
    setUploadPercent(0);
    try {
      if (multiple) {
        const filesToUpload = pendingFilesRef.current;
        if (filesToUpload.length === 0) {
          toast.error('No files to upload');
          setIsUploading(false);
          return;
        }

        const urls = await uploadFilesWithProgress(filesToUpload, bucket);
        pendingFilesRef.current = [];
        setPreviews([]);
        onChange([...images, ...urls]);
        toast.success(`${urls.length} image(s) uploaded successfully`);
      } else {
        const file = pendingFilesRef.current[0];
        if (!file) {
          toast.error('No file to upload');
          setIsUploading(false);
          return;
        }

        const url = await uploadToCloudinary(file, bucket, setUploadPercent);
        pendingFilesRef.current = [];
        setPreviews([]);
        onChange(url);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      logger.error('Upload error', error, { component: 'ImageUpload', action: 'handleUpload', bucket });
      toast.error('Failed to upload image(s). Please try again.');
    } finally {
      setUploadPercent(0);
      setIsUploading(false);
    }
  };

  const displayImages = [...images, ...previews];

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          displayImages.length > 0 && 'border-solid'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={handleFileInputChange}
        />

        {displayImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Drop images here or click to upload</p>
            <p className="text-xs text-muted-foreground mb-4">
              {multiple ? `Upload up to ${maxFiles} images` : 'Upload a single image'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Select {multiple ? 'Images' : 'Image'}
            </Button>
          </div>
        ) : (
          <div className="p-4">
            <div className={cn(
              'grid gap-4',
              multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
            )}>
              <AnimatePresence>
                {displayImages.map((image, index) => (
                  <motion.div
                    key={`${image}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted",
                      previewWrapperClassName,
                    )}
                  >
                      {isBulkDeleteEnabled && (
                        <label
                          className={`absolute top-2 left-2 z-10 rounded bg-background/80 dark:bg-background/60 backdrop-blur px-2 py-1 flex items-center gap-2 border ${
                            selectedIndexes.has(index) ? 'border-primary/60' : 'border-border/50'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            aria-label="Select image for bulk deletion"
                            checked={selectedIndexes.has(index)}
                            onChange={() => toggleSelectedIndex(index)}
                          />
                          <span className="text-[10px] text-muted-foreground">Select</span>
                        </label>
                      )}
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className={cn(
                        'w-full h-full object-cover',
                        previewClassName
                      )}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity h-9 w-9"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add More Button (only for multiple) */}
              {multiple && displayImages.length < maxFiles && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Add More</p>
                  </div>
                </motion.div>
              )}
            </div>

            {isBulkDeleteEnabled && selectedIndexes.size > 0 && (
              <div className="mt-4 flex items-center justify-end">
                <Button type="button" variant="destructive" onClick={deleteSelected}>
                  Delete selected
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change / Add more button only (upload happens on parent form Save where applicable) */}
      {displayImages.length > 0 && (
        <div className="flex justify-end gap-2">
          {enableCropAdjust && !multiple && (
            <Button
              type="button"
              variant="secondary"
              onClick={openAdjustDialogForExisting}
              className="gap-2"
              disabled={isUploading}
            >
              Adjust Frame
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4" />
            {multiple ? 'Add More Images' : 'Change Image'}
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Uploading...
            </span>
            <span className="font-medium">{uploadPercent}%</span>
          </div>
          <Progress value={uploadPercent} className="h-2" />
        </div>
      )}

      <Dialog open={isCropOpen} onOpenChange={(open) => { if (!open) closeCropDialog(); }}>
        <DialogContent className="max-w-lg w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>Adjust cover image</DialogTitle>
          </DialogHeader>
          <div className="px-4 pt-2 pb-3">
            <p className="text-xs text-muted-foreground mb-2">
              Drag image inside the frame and pinch/zoom (or use slider). Then tap <strong>Use This Crop</strong>.
            </p>
            <div className="relative w-full h-[320px] rounded-lg overflow-hidden bg-black/80">
              {cropSource && (
                <Cropper
                  image={cropSource}
                  crop={cropPosition}
                  zoom={cropZoom}
                  minZoom={MIN_CROP_ZOOM}
                  maxZoom={MAX_CROP_ZOOM}
                  aspect={cropAspect}
                  onCropChange={setCropPosition}
                  onZoomChange={setCropZoom}
                  onCropComplete={handleCropComplete}
                  objectFit="cover"
                  showGrid={true}
                />
              )}
            </div>
            <div className="mt-3">
              <label className="text-xs text-muted-foreground mb-1 block">Zoom</label>
              <input
                type="range"
                min={MIN_CROP_ZOOM}
                max={MAX_CROP_ZOOM}
                step={0.01}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="px-4 pb-4 pt-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeCropDialog} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={uploadOriginalImage} disabled={isUploading}>
              Upload Original
            </Button>
            <Button type="button" onClick={uploadCroppedImage} disabled={isUploading || !croppedPixels}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Use This Crop'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
