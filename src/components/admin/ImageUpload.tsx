import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<File[]>([]); // Store File objects for upload (can't attach to string)
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      setIsUploading(true);
      try {
        if (multiple) {
          const urls = await Promise.all(validFiles.map((f) => uploadToCloudinary(f, bucket)));
          onChange([...images, ...urls]);
          toast.success(`${urls.length} image(s) uploaded successfully`);
        } else {
          const url = await uploadToCloudinary(validFiles[0], bucket);
          onChange(url);
          toast.success('Image uploaded successfully');
        }
      } catch (error) {
        logger.error('Upload error', error, { component: 'ImageUpload', action: 'handleFileSelect', bucket });
        const message = error instanceof Error ? error.message : 'Failed to upload image(s). Please try again.';
        toast.error('Upload failed', { description: message });
      } finally {
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
  }, [images, multiple, maxFiles, onChange, bucket, uploadOnSelect]);

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
    try {
      if (multiple) {
        const filesToUpload = pendingFilesRef.current;
        if (filesToUpload.length === 0) {
          toast.error('No files to upload');
          setIsUploading(false);
          return;
        }

        const urls = await Promise.all(filesToUpload.map((f) => uploadToCloudinary(f, bucket)));
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

        const url = await uploadToCloudinary(file, bucket);
        pendingFilesRef.current = [];
        setPreviews([]);
        onChange(url);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      logger.error('Upload error', error, { component: 'ImageUpload', action: 'handleUpload', bucket });
      toast.error('Failed to upload image(s). Please try again.');
    } finally {
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
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
    </div>
  );
}
