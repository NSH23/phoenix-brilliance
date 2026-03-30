import { supabase } from '@/lib/supabase';
import { resolvePublicStorageUrl } from '@/services/storage';

function normAlbumCover(url: string | null | undefined): string | null {
  if (url == null || url === '') return null;
  return resolvePublicStorageUrl(url, 'album-images') || null;
}

function normalizeAlbumMedia(m: AlbumMedia): AlbumMedia {
  return {
    ...m,
    url: m.url ? resolvePublicStorageUrl(m.url, 'album-images') : null,
  };
}

function normalizeAlbum<T extends Album & { album_media?: AlbumMedia[] }>(row: T): T {
  return {
    ...row,
    cover_image: normAlbumCover(row.cover_image),
    album_media: row.album_media?.map(normalizeAlbumMedia),
  };
}

export interface Album {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  event_date: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlbumMedia {
  id: string;
  album_id: string;
  type: 'image' | 'video';
  url: string | null;
  youtube_url: string | null;
  caption: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Get all albums
export async function getAllAlbums() {
  const { data, error } = await supabase
    .from('event_albums')
    .select(`
      *,
      events!inner (id, title, slug, is_active)
    `)
    .order('is_featured', { ascending: false })
    .order('event_date', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => normalizeAlbum(row as Album & { album_media?: AlbumMedia[] }));
}

// Get albums by event ID
export async function getAlbumsByEventId(eventId: string) {
  const { data, error } = await supabase
    .from('event_albums')
    .select('*')
    .eq('event_id', eventId)
    .order('event_date', { ascending: false });

  if (error) throw error;
  return ((data || []) as Album[]).map((row) => normalizeAlbum(row));
}

// Get featured albums
export async function getFeaturedAlbums(limit = 6) {
  const { data, error } = await supabase
    .from('event_albums')
    .select(`
      *,
      events!inner (id, title, slug, is_active)
    `)
    .eq('is_featured', true)
    .eq('events.is_active', true)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((row) => normalizeAlbum(row as Album & { album_media?: AlbumMedia[] }));
}

// Get album by ID
export async function getAlbumById(id: string) {
  const { data, error } = await supabase
    .from('event_albums')
    .select(`
      *,
      events (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return normalizeAlbum(data as Album & { events?: unknown; album_media?: AlbumMedia[] });
}

// Get album with media
export async function getAlbumWithMedia(id: string) {
  const { data, error } = await supabase
    .from('event_albums')
    .select(`
      *,
      events (*),
      album_media (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return normalizeAlbum(data as Album & { events?: unknown; album_media?: AlbumMedia[] });
}

// Create album
export async function createAlbum(album: Omit<Album, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('event_albums')
    .insert([album])
    .select()
    .single();

  if (error) throw error;
  return data as Album;
}

// Update album
export async function updateAlbum(id: string, updates: Partial<Album>) {
  const { data, error } = await supabase
    .from('event_albums')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Album;
}

// Delete album
export async function deleteAlbum(id: string) {
  const { error } = await supabase
    .from('event_albums')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get album media
export async function getAlbumMedia(albumId: string) {
  const { data, error } = await supabase
    .from('album_media')
    .select('*')
    .eq('album_id', albumId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return ((data || []) as AlbumMedia[]).map(normalizeAlbumMedia);
}

// Create album media
export async function createAlbumMedia(media: Omit<AlbumMedia, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('album_media')
    .insert([media])
    .select()
    .single();

  if (error) throw error;
  return data as AlbumMedia;
}

// Update album media
export async function updateAlbumMedia(id: string, updates: Partial<AlbumMedia>) {
  const { data, error } = await supabase
    .from('album_media')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AlbumMedia;
}

// Delete album media
export async function deleteAlbumMedia(id: string) {
  const { error } = await supabase
    .from('album_media')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get recent album media with album title (for dashboard activity)
export async function getRecentAlbumMedia(limit = 5) {
  const { data: media, error: e1 } = await supabase
    .from('album_media')
    .select('id, created_at, album_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (e1) throw e1;
  if (!media?.length) return [];
  const ids = [...new Set(media.map((m) => m.album_id))];
  const { data: albums } = await supabase.from('event_albums').select('id, title').in('id', ids);
  const titleMap = Object.fromEntries((albums || []).map((a) => [a.id, a.title]));
  return media.map((m) => ({
    id: m.id,
    created_at: m.created_at,
    album_id: m.album_id,
    event_albums: { title: titleMap[m.album_id] || 'Unknown album' },
  }));
}

// Bulk update media display order
export async function updateMediaDisplayOrder(updates: { id: string; display_order: number }[]) {
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('album_media')
      .update({ display_order })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
}

/**
 * Get media counts for all albums in a single query.
 * Avoids N+1 queries where the admin Albums page fetches album_media per-album.
 */
export async function getAllAlbumMediaCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('album_media')
    .select('album_id');

  if (error || !data) return {};

  return (data as Array<{ album_id?: string }>).reduce((acc, row) => {
    const albumId = row.album_id;
    if (!albumId) return acc;
    acc[albumId] = (acc[albumId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
