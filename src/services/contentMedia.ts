import { supabase } from '@/lib/supabase';

const CONTENT_MEDIA_BUCKET = 'content-media';

/** If url is a storage path (no protocol), return full public URL; otherwise return as-is. */
export function resolveContentMediaUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const { data } = supabase.storage.from(CONTENT_MEDIA_BUCKET).getPublicUrl(trimmed);
    return data.publicUrl;
}

export interface ContentMedia {
    id: string;
    category: 'hero' | 'moment';
    media_type?: 'video' | 'image';
    title?: string;
    url: string;
    thumbnail_url?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface HeroMedia {
    videoUrl: string | null;
    imageUrls: string[];
}

// Get Hero Videos (Active) - all hero media for admin
export async function getHeroVideos() {
    const { data, error } = await supabase
        .from('content_media')
        .select('*')
        .eq('category', 'hero')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    const list = (data || []) as ContentMedia[];
    return list.map((item) => ({ ...item, url: resolveContentMediaUrl(item.url) }));
}

// Get hero media for homepage: 1 video (front) + 2 images (back). Used by HeroSection.
export async function getHeroMedia(): Promise<HeroMedia> {
    const { data, error } = await supabase
        .from('content_media')
        .select('url, media_type, display_order')
        .eq('category', 'hero')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    const list = (data || []) as { url: string; media_type?: string; display_order: number }[];
    const firstVideo = list.find((m) => m.media_type === 'video' || isVideoUrl(m.url));
    const imageList = list.filter((m) => m.media_type === 'image' || isImageUrl(m.url));
    return {
        videoUrl: firstVideo?.url ? resolveContentMediaUrl(firstVideo.url) : null,
        imageUrls: imageList.slice(0, 2).map((m) => resolveContentMediaUrl(m.url)),
    };
}

function isVideoUrl(url: string): boolean {
    const lower = (url || '').toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');
}
function isImageUrl(url: string): boolean {
    const lower = (url || '').toLowerCase();
    return /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(lower);
}

// Get Moment Moments/Reels (Active)
export async function getMomentsReels() {
    const { data, error } = await supabase
        .from('content_media')
        .select('*')
        .eq('category', 'moment')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    const list = (data || []) as ContentMedia[];
    return list.map((item) => ({ ...item, url: resolveContentMediaUrl(item.url) }));
}

// Get All Content Media (Admin)
export async function getAllContentMedia(category?: 'hero' | 'moment') {
    let query = supabase
        .from('content_media')
        .select('*')
        .order('display_order', { ascending: true });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    const list = (data || []) as ContentMedia[];
    return list.map((item) => ({ ...item, url: resolveContentMediaUrl(item.url) }));
}

// Create Content Media (hero or moment – both use content_media table)
export async function createContentMedia(media: Omit<ContentMedia, 'id' | 'created_at' | 'updated_at'>) {
    const category = media.category === 'moment' ? 'moment' : 'hero';
    const media_type = media.media_type === 'image' ? 'image' : 'video';
    const row = {
        category,
        media_type,
        title: media.title ?? null,
        url: media.url,
        thumbnail_url: media.thumbnail_url ?? null,
        is_active: media.is_active !== false,
        display_order: typeof media.display_order === 'number' ? media.display_order : 0,
    };
    const { data, error } = await supabase
        .from('content_media')
        .insert([row])
        .select()
        .single();

    if (error) throw error;
    return data as ContentMedia;
}

// Update Content Media
export async function updateContentMedia(id: string, updates: Partial<ContentMedia>) {
    const { data, error } = await supabase
        .from('content_media')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as ContentMedia;
}

// Delete Content Media
export async function deleteContentMedia(id: string) {
    const { error } = await supabase
        .from('content_media')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
