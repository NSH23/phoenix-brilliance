// Trigger Vercel rebuild
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Play,
    Film,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ImageIcon
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTimeLocal } from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    getAllContentMedia,
    createContentMedia,
    updateContentMedia,
    deleteContentMedia,
    type ContentMedia
} from '@/services/contentMedia';
import { logger } from '@/utils/logger';

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

const CONTENT_MEDIA_BUCKET = 'content-media';

/** Upload a video/image file to content-media bucket. Returns public URL. */
async function uploadContentMediaFile(file: File, folder: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const isVideo = file.type.startsWith('video/');
    const contentType = file.type || (isVideo ? (ext === 'webm' ? 'video/webm' : 'video/mp4') : 'image/jpeg');

    const { data, error } = await supabase.storage.from(CONTENT_MEDIA_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
    });

    if (error) {
        const msg = error.message || '';
        if (msg.includes('row-level security') || msg.includes('policy')) {
            throw new Error('Storage access denied. Make sure you are logged in as an admin and the content-media bucket allows uploads.');
        }
        if (msg.includes('File size limit') || msg.includes('too large')) {
            throw new Error('File is too large. Use a direct Video URL instead, or use a smaller file.');
        }
        if (/mime type .* is not supported/i.test(msg)) {
            throw new Error('This file type is not allowed. In Supabase Dashboard go to Storage → content-media → Settings and add allowed MIME types: video/mp4, video/webm.');
        }
        throw new Error(msg || 'Upload failed');
    }

    const { data: urlData } = supabase.storage.from(CONTENT_MEDIA_BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
}

function HeroSlotCard({
    slotLabel,
    slotIndex,
    mediaType,
    item,
    onEdit,
    onDelete,
    onAdd
}: {
    slotLabel: string;
    slotIndex: number;
    mediaType: 'video' | 'image';
    item: ContentMedia | null;
    onEdit: (item: ContentMedia) => void;
    onDelete: (item: ContentMedia) => void;
    onAdd: (slotIndex: number, mediaType: 'video' | 'image') => void;
}) {
    return (
        <Card className="overflow-hidden group">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                    <div className="w-full sm:w-32 h-40 sm:h-20 bg-black/10 rounded-lg overflow-hidden relative flex-shrink-0">
                        {item?.url ? (
                            mediaType === 'video' ? (
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    onMouseOver={e => e.currentTarget.play()}
                                    onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                />
                            ) : (
                                <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                {mediaType === 'video' ? <Play size={24} /> : <ImageIcon size={24} />}
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            {mediaType === 'video' ? <Play className="text-white/80" size={24} /> : <ImageIcon className="text-white/80" size={24} />}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                        <h3 className="font-medium truncate">{slotLabel}</h3>
                        <p className="text-sm text-muted-foreground truncate font-mono">
                            {item?.url || 'Not set'}
                        </p>
                        {item && (
                            <p className="text-xs text-muted-foreground mt-1">{formatDateTimeLocal(item.updated_at)}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {item ? (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                                <Pencil size={16} /> <span className="sm:hidden ml-2">Edit</span>
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(item)}>
                                <Trash2 size={16} /> <span className="sm:hidden ml-2">Delete</span>
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" onClick={() => onAdd(slotIndex, mediaType)}>
                            <Plus size={16} className="mr-2" /> Add
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function MediaList({
    items,
    onEdit,
    onDelete
}: {
    items: ContentMedia[];
    onEdit: (item: ContentMedia) => void;
    onDelete: (item: ContentMedia) => void;
}) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                <p>No media found. Add some content to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                            <div className="w-full sm:w-32 h-40 sm:h-20 bg-black/10 rounded-lg overflow-hidden relative flex-shrink-0">
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                    <Film className="text-white/80" size={24} />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-medium truncate">{item.title || 'Untitled Video'}</h3>
                                    {!item.is_active && (
                                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">Inactive</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate font-mono">{item.url}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Order: {item.display_order}</span>
                                    <span>{formatDateTimeLocal(item.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                            <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                                <Pencil size={16} /> <span className="sm:hidden ml-2">Edit</span>
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(item)}>
                                <Trash2 size={16} /> <span className="sm:hidden ml-2">Delete</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function ContentMedia() {
    const [uploading, setUploading] = useState(false);
    const [items, setItems] = useState<ContentMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'hero' | 'moment'>('hero');
    const [editingItem, setEditingItem] = useState<ContentMedia | null>(null);
    const [editingSlot, setEditingSlot] = useState<{ slotIndex: number; mediaType: 'video' | 'image' } | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<ContentMedia> & { file?: FileList }>();

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useEffect(() => {
        if (isDialogOpen) {
            setUploadSuccess(false);
            const t = setTimeout(() => {
                const vid = document.getElementById('video-upload') as HTMLInputElement;
                const img = document.getElementById('image-upload') as HTMLInputElement;
                if (vid) vid.value = '';
                if (img) img.value = '';
            }, 0);
            return () => clearTimeout(t);
        }
    }, [isDialogOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllContentMedia(activeTab);
            setItems(data);
        } catch (error) {
            console.error('Failed to load media', error);
            toast.error('Failed to load media');
        } finally {
            setLoading(false);
        }
    };

    const heroSlots = (() => {
        const list = items.filter(i => i.category === 'hero');
        const slot0 = list.find(i => i.display_order === 0 && (i.media_type === 'video' || isVideoUrl(i.url)));
        const slot1 = list.find(i => i.display_order === 1);
        const slot2 = list.find(i => i.display_order === 2);
        return [slot0 ?? null, slot1 ?? null, slot2 ?? null];
    })();

    const momentItems = items.filter(i => i.category === 'moment');

    const handleEdit = (item: ContentMedia) => {
        setEditingItem(item);
        setEditingSlot(item.category === 'hero'
            ? { slotIndex: item.display_order, mediaType: (item.media_type === 'image' ? 'image' : 'video') }
            : null);
        reset({ ...item, url: item.url });
        setIsDialogOpen(true);
    };

    const handleAddHeroSlot = (slotIndex: number, mediaType: 'video' | 'image') => {
        setEditingItem(null);
        setEditingSlot({ slotIndex, mediaType });
        reset({ url: '', title: '', display_order: slotIndex, media_type: mediaType, is_active: true });
        setIsDialogOpen(true);
    };

    const handleDelete = async (item: ContentMedia) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            await deleteContentMedia(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            toast.success('Deleted');
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete');
        }
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('video/')) return;
        setUploading(true);
        setUploadSuccess(false);
        try {
            const url = await uploadContentMediaFile(file, activeTab);
            setValue('url', url);
            setUploadSuccess(true);
            toast.success('Video uploaded. Click Save to add it.');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            toast.error('Upload failed', { description: msg });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        setUploading(true);
        setUploadSuccess(false);
        try {
            const url = await uploadContentMediaFile(file, activeTab);
            setValue('url', url);
            setUploadSuccess(true);
            toast.success('Image uploaded. Click Save to add it.');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            toast.error('Upload failed', { description: msg });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const onSubmit = async (data: Partial<ContentMedia> & { file?: FileList }) => {
        try {
            setIsDeploying(true);
            let mediaUrl = (data.url ?? '').trim();

            const fileInput = document.getElementById(editingSlot?.mediaType === 'image' ? 'image-upload' : 'video-upload') as HTMLInputElement;
            const file = fileInput?.files?.[0];
            if (file && !mediaUrl) {
                setUploading(true);
                try {
                    mediaUrl = await uploadContentMediaFile(file, activeTab);
                } finally {
                    setUploading(false);
                }
            }

            if (!mediaUrl) {
                toast.error('Please upload a file or enter a video/image URL.');
                return;
            }

            const payload: Partial<ContentMedia> = {
                ...data,
                url: mediaUrl,
                category: activeTab,
                is_active: data.is_active ?? true,
            };
            if (editingSlot) {
                payload.display_order = editingSlot.slotIndex;
                payload.media_type = editingSlot.mediaType;
            } else if (editingItem) {
                payload.display_order = editingItem.display_order;
                payload.media_type = editingItem.media_type ?? 'video';
            }

            if (editingItem) {
                const updated = await updateContentMedia(editingItem.id, payload);
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
                toast.success('Updated successfully');
            } else {
                const createPayload = {
                    category: payload.category!,
                    media_type: payload.media_type ?? 'video',
                    title: payload.title ?? null,
                    url: payload.url!,
                    is_active: payload.is_active ?? true,
                    display_order: payload.display_order ?? 0,
                };
                const created = await createContentMedia(createPayload);
                setItems(prev => [...prev, created]);
                toast.success(activeTab === 'moment' ? 'Video added to Moments We\'ve Crafted.' : 'Added successfully');
            }
            setIsDialogOpen(false);
            setEditingSlot(null);
        } catch (error) {
            logger.error('Failed to save media', error);
            const msg = error instanceof Error ? error.message : (error && typeof (error as { message?: string }).message === 'string' ? (error as { message: string }).message : 'Failed to save');
            toast.error('Failed to save', { description: msg });
            setUploading(false);
        } finally {
            setIsDeploying(false);
        }
    };

    const isHeroDialog = activeTab === 'hero' && (editingItem?.category === 'hero' || editingSlot);
    const slotMediaType = editingSlot?.mediaType ?? (editingItem?.media_type === 'image' ? 'image' : 'video');

    return (
        <AdminLayout title="Manage Videos" subtitle="Hero: 1 video + 2 background images. Moments: reels for Moments We've Crafted.">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-[400px]">
                    <TabsList className="w-full">
                        <TabsTrigger value="hero" className="flex-1 flex items-center justify-center gap-2">
                            <Play size={16} /> Hero
                        </TabsTrigger>
                        <TabsTrigger value="moment" className="flex-1 flex items-center justify-center gap-2">
                            <Film size={16} /> Moments
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : activeTab === 'hero' ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        Homepage hero shows one video in front and two images in the back. Set the video and two background images below.
                    </p>
                    <HeroSlotCard
                        slotLabel="Hero Video (front)"
                        slotIndex={0}
                        mediaType="video"
                        item={heroSlots[0]}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAddHeroSlot}
                    />
                    <HeroSlotCard
                        slotLabel="Background Image 1"
                        slotIndex={1}
                        mediaType="image"
                        item={heroSlots[1]}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAddHeroSlot}
                    />
                    <HeroSlotCard
                        slotLabel="Background Image 2"
                        slotIndex={2}
                        mediaType="image"
                        item={heroSlots[2]}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAddHeroSlot}
                    />
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground mb-4">
                        Videos you add here are saved to the same <strong>content_media</strong> table (category: moment) and appear in the &quot;Moments We&apos;ve Crafted&quot; section on the homepage. Upload a file or paste a video URL, then click Save.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <Button onClick={() => { setEditingItem(null); setEditingSlot({ slotIndex: momentItems.length, mediaType: 'video' }); reset({ is_active: true, display_order: momentItems.length, url: '', title: '' }); setIsDialogOpen(true); }}>
                            <Plus size={16} className="mr-2" /> Add Video
                        </Button>
                    </div>
                    <MediaList items={momentItems} onEdit={handleEdit} onDelete={handleDelete} />
                </>
            )}

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) setEditingSlot(null);
                setIsDialogOpen(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem
                                ? `Edit ${slotMediaType === 'image' ? 'Image' : 'Video'}`
                                : activeTab === 'moment'
                                    ? 'Add Video'
                                    : `Add ${slotMediaType === 'image' ? 'Background Image' : 'Hero Video'}`}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {slotMediaType === 'video' ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Video File</Label>
                                    <Input
                                        id="video-upload"
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        className="cursor-pointer"
                                        onChange={handleVideoFileChange}
                                        disabled={uploading}
                                    />
                                    {uploading && (
                                        <p className="text-sm text-primary flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Uploading video… please wait (do not close).
                                        </p>
                                    )}
                                    {uploadSuccess && (
                                        <p className="text-sm text-green-600 dark:text-green-400">Upload complete. Click Save below to add this video.</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">MP4 or WebM. Video uploads as soon as you select a file. For very large files (50MB+), paste a direct Video URL below instead.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Or Video URL</Label>
                                    <Input {...register('url')} placeholder="https://example.com/video.mp4" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Image File</Label>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="cursor-pointer"
                                        onChange={handleImageFileChange}
                                        disabled={uploading}
                                    />
                                    {uploading && (
                                        <p className="text-sm text-primary flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Uploading image… please wait.
                                        </p>
                                    )}
                                    {uploadSuccess && (
                                        <p className="text-sm text-green-600 dark:text-green-400">Upload complete. Click Save below to add this image.</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Or Image URL</Label>
                                    <Input {...register('url')} placeholder="https://example.com/image.jpg" />
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label>Title (Optional)</Label>
                            <Input {...register('title')} placeholder="e.g. Hero video" />
                        </div>
                        {activeTab === 'moment' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Display Order</Label>
                                    <Input type="number" {...register('display_order', { valueAsNumber: true })} />
                                </div>
                                <div className="flex items-center gap-3 pt-8">
                                    <Label htmlFor="is-active" className="cursor-pointer">Active</Label>
                                    <Switch id="is-active" checked={watch('is_active')} onCheckedChange={(c) => setValue('is_active', c)} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'hero' && (
                            <div className="flex items-center gap-3">
                                <Label htmlFor="is-active-hero" className="cursor-pointer">Active</Label>
                                <Switch id="is-active-hero" checked={watch('is_active')} onCheckedChange={(c) => setValue('is_active', c)} />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isDeploying || uploading}>
                                {(isDeploying || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {uploading ? 'Uploading video…' : isDeploying ? 'Saving…' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
