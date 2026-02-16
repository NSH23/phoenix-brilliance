import { supabase } from '@/lib/supabase';

export interface ContentMedia {
    id: string;
    category: 'hero' | 'moment';
    title?: string;
    url: string;
    thumbnail_url?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

// Get Hero Videos (Active)
export async function getHeroVideos() {
    const { data, error } = await supabase
        .from('content_media')
        .select('*')
        .eq('category', 'hero')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data as ContentMedia[];
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
    return data as ContentMedia[];
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
    return data as ContentMedia[];
}

// Create Content Media
export async function createContentMedia(media: Omit<ContentMedia, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('content_media')
        .insert([media])
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
