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
    GripVertical
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
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
    TabsContent,
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

function MediaList({
    items,
    onEdit,
    onDelete
}: {
    items: ContentMedia[],
    onEdit: (item: ContentMedia) => void,
    onDelete: (item: ContentMedia) => void
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
                            <div className="hidden sm:block cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-foreground">
                                <GripVertical size={20} />
                            </div>

                            <div className="w-full sm:w-32 h-40 sm:h-20 bg-black/10 rounded-lg overflow-hidden relative flex-shrink-0">
                                {item.category === 'hero' ? (
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        playsInline
                                        onMouseOver={e => e.currentTarget.play()}
                                        onMouseOut={e => {
                                            e.currentTarget.pause();
                                            e.currentTarget.currentTime = 0;
                                        }}
                                    />
                                ) : (
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                    {item.category === 'hero' ? <Play className="text-white/80" size={24} /> : <Film className="text-white/80" size={24} />}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-medium truncate">{item.title || 'Untitled Video'}</h3>
                                    {!item.is_active && (
                                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate font-mono">
                                    {item.url}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Order: {item.display_order}</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
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
    const [isDeploying, setIsDeploying] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Partial<ContentMedia>>(); // Added partial for form

    useEffect(() => {
        loadData();
    }, [activeTab]);

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

    const handleCreate = () => {
        setEditingItem(null);
        reset({});
        setIsDialogOpen(true);
    };

    const handleEdit = (item: ContentMedia) => {
        setEditingItem(item);
        reset(item);
        setIsDialogOpen(true);
    };

    const handleDelete = async (item: ContentMedia) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        try {
            await deleteContentMedia(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            toast.success('Video deleted');
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete video');
        }
    };

    const onSubmit = async (data: Partial<ContentMedia>) => {
        try {
            setIsDeploying(true);
            let videoUrl = data.url;

            // Handle File Upload if a file is selected
            const fileInput = document.getElementById('video-upload') as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `${activeTab}/${fileName}`;

                setUploading(true);
                const { error: uploadError } = await supabase.storage
                    .from('content-media')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('content-media')
                    .getPublicUrl(filePath);

                videoUrl = publicUrl;
                setUploading(false);
            }

            const payload = {
                ...data,
                url: videoUrl,
                category: activeTab
            };

            if (editingItem) {
                const updated = await updateContentMedia(editingItem.id, payload);
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
                toast.success('Video updated successfully');
            } else {
                const created = await createContentMedia(payload as any);
                setItems(prev => [...prev, created]);
                toast.success('Video added successfully');
            }
            setIsDialogOpen(false);
        } catch (error) {
            logger.error('Failed to save media', error);
            toast.error('Failed to save video');
            setUploading(false);
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <AdminLayout title="Manage Videos" subtitle="Control Hero section videos and Moments We've Crafted reels.">
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

                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus size={16} className="mr-2" /> Add Video
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <MediaList
                    items={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Video' : 'Add New Video'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Video File</Label>
                            <Input
                                id="video-upload"
                                type="file"
                                accept="video/mp4,video/webm"
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload a video file (MP4, WebM). This will upload to the 'content-media' bucket.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Or Video URL</Label>
                            <Input
                                {...register('url')}
                                placeholder="https://example.com/video.mp4"
                            />
                            <p className="text-xs text-muted-foreground">
                                Alternatively, paste a direct link if hosted elsewhere.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Title (Optional)</Label>
                            <Input {...register('title')} placeholder="e.g. Summer Wedding" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Order</Label>
                                <Input
                                    type="number"
                                    {...register('display_order', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-8">
                                <Label htmlFor="is-active" className="cursor-pointer">Active</Label>
                                <Switch
                                    id="is-active"
                                    checked={watch('is_active')}
                                    onCheckedChange={(checked) => setValue('is_active', checked)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isDeploying || uploading}>
                                {(isDeploying || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {uploading ? 'Uploading...' : 'Save Video'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

