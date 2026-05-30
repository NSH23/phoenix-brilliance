// Trigger Vercel rebuild
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    getAllContentMedia,
    deleteContentMedia,
    type ContentMedia
} from '@/services/contentMedia';
import { getYouTubeThumbnail, isYouTubeValue } from '../../lib/youtube';

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

function HeroSlotCard({
    slotLabel,
    slotIndex,
    mediaType,
    item,
    onOpen,
    onDelete,
}: {
    slotLabel: string;
    slotIndex: number;
    mediaType: 'video' | 'image';
    item: ContentMedia | null;
    onOpen: (slotIndex: number) => void;
    onDelete: (item: ContentMedia) => void;
}) {
    return (
        <Card
            className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
            onClick={() => onOpen(slotIndex)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(slotIndex);
                }
            }}
        >
            <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
                <div className="flex w-full flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-lg bg-black/10 sm:h-20 sm:w-32">
                        {item?.url ? (
                            mediaType === 'video' ? (
                                isYouTubeValue(item.url) ? (
                                    <img
                                        src={getYouTubeThumbnail(item.url)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <video
                                        src={item.url}
                                        className="h-full w-full object-cover"
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        onMouseOver={e => e.currentTarget.play()}
                                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                )
                            ) : (
                                <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            )
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                {mediaType === 'video' ? <Play size={24} /> : <ImageIcon size={24} />}
                            </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                            {mediaType === 'video' ? <Play className="text-white/80" size={24} /> : <ImageIcon className="text-white/80" size={24} />}
                        </div>
                    </div>
                    <div className="min-w-0 w-full flex-1">
                        <h3 className="truncate font-medium">{slotLabel}</h3>
                        <p className="truncate font-mono text-sm text-muted-foreground">
                            {item?.url || 'Not set'}
                        </p>
                        {item ? (
                            <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeLocal(item.updated_at)}</p>
                        ) : (
                            <p className="mt-1 text-xs text-muted-foreground">Click to configure</p>
                        )}
                    </div>
                </div>
                <div className="flex w-full items-center justify-end gap-2 max-md:flex-col max-md:items-stretch sm:w-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        className="max-md:h-10 max-md:w-full"
                        onClick={(e) => { e.stopPropagation(); onOpen(slotIndex); }}
                    >
                        <Pencil size={16} /> <span className="ml-2">{item ? 'Edit' : 'Set up'}</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        disabled={!item}
                        className="max-md:h-10 max-md:w-full"
                        onClick={(e) => { e.stopPropagation(); item && onDelete(item); }}
                    >
                        <Trash2 size={16} /> <span className="ml-2">Delete</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function MediaList({
    items,
    onDelete,
    onOpen,
}: {
    items: ContentMedia[];
    onDelete: (item: ContentMedia) => void;
    onOpen: (item: ContentMedia) => void;
}) {
    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed bg-muted/30 py-12 text-center text-muted-foreground">
                <p>No media found. Add some content to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <Card
                    key={item.id}
                    className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                    onClick={() => onOpen(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(item); } }}
                >
                    <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
                        <div className="flex w-full flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-lg bg-black/10 sm:h-20 sm:w-32">
                                {isYouTubeValue(item.url) ? (
                                    <img
                                        src={getYouTubeThumbnail(item.url)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <video
                                        src={item.url}
                                        className="h-full w-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                )}
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Film className="text-white/80" size={24} />
                                </div>
                            </div>
                            <div className="min-w-0 w-full flex-1">
                                <div className="mb-1 flex items-center gap-3">
                                    <h3 className="truncate font-medium">{item.title || 'Untitled Video'}</h3>
                                    {!item.is_active && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
                                    )}
                                </div>
                                <p className="truncate font-mono text-sm text-muted-foreground">{item.url}</p>
                                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Order: {item.display_order}</span>
                                    <span>{formatDateTimeLocal(item.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex w-full items-center justify-end gap-2 border-t pt-3 max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:border-t-0 max-md:pt-0 sm:mt-0 sm:w-auto sm:border-t-0 sm:pt-0">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpen(item); }} className="max-md:h-10 max-md:w-full">
                                <Pencil size={16} /> <span className="ml-2">Edit</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="max-md:h-10 max-md:w-full">
                                <Trash2 size={16} /> <span className="ml-2">Delete</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function ContentMedia() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [items, setItems] = useState<ContentMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hero' | 'moment'>(() =>
        tabParam === 'moment' ? 'moment' : 'hero'
    );

    useEffect(() => {
        if (tabParam === 'hero' || tabParam === 'moment') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

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

    const heroSlots = (() => {
        const list = items.filter(i => i.category === 'hero');
        const slot0 = list.find(i => i.display_order === 0 && (i.media_type === 'video' || isVideoUrl(i.url) || isYouTubeValue(i.url)));
        const slot1 = list.find(i => i.display_order === 1);
        const slot2 = list.find(i => i.display_order === 2);
        return [slot0 ?? null, slot1 ?? null, slot2 ?? null];
    })();

    const momentItems = items.filter(i => i.category === 'moment');

    const handleTabChange = (value: string) => {
        const tab = value as 'hero' | 'moment';
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
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

    return (
        <AdminLayout title="Manage Videos" subtitle="Hero: 1 video + 2 background images. Moments: reels for Moments We've Crafted.">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-[400px]">
                    <TabsList className="w-full">
                        <TabsTrigger value="hero" className="flex flex-1 items-center justify-center gap-2">
                            <Play size={16} /> Hero
                        </TabsTrigger>
                        <TabsTrigger value="moment" className="flex flex-1 items-center justify-center gap-2">
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
                    <p className="mb-4 text-sm text-muted-foreground">
                        Homepage hero shows one video in front and two images in the back. Click a slot to open the full editor.
                    </p>
                    <HeroSlotCard
                        slotLabel="Hero Video (front)"
                        slotIndex={0}
                        mediaType="video"
                        item={heroSlots[0]}
                        onOpen={(slot) => navigate(`/admin/media/hero/${slot}/edit`)}
                        onDelete={handleDelete}
                    />
                    <HeroSlotCard
                        slotLabel="Background Image 1"
                        slotIndex={1}
                        mediaType="image"
                        item={heroSlots[1]}
                        onOpen={(slot) => navigate(`/admin/media/hero/${slot}/edit`)}
                        onDelete={handleDelete}
                    />
                    <HeroSlotCard
                        slotLabel="Background Image 2"
                        slotIndex={2}
                        mediaType="image"
                        item={heroSlots[2]}
                        onOpen={(slot) => navigate(`/admin/media/hero/${slot}/edit`)}
                        onDelete={handleDelete}
                    />
                </div>
            ) : (
                <>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Videos you add here appear in the &quot;Moments We&apos;ve Crafted&quot; section on the homepage. Click a card to edit.
                    </p>
                    <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <Button onClick={() => navigate('/admin/media/moments/new/edit')}>
                            <Plus size={16} className="mr-2" /> Add Video
                        </Button>
                    </div>
                    <MediaList
                        items={momentItems}
                        onDelete={handleDelete}
                        onOpen={(item) => navigate(`/admin/media/moments/${item.id}/edit`)}
                    />
                </>
            )}
        </AdminLayout>
    );
}
