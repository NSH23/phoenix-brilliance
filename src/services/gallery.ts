import { supabase } from '@/lib/supabase';

export interface GalleryImage {
  id: string;
  url: string;
  title: string | null;
  category: string | null;
  is_featured: boolean;
  display_order: number;
  row_index: number;  // Which row this image belongs to (0, 1, 2...)
  created_at: string;
  updated_at: string;
}

// Get all gallery images
export async function getAllGalleryImages() {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('row_index', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeGalleryImage) as GalleryImage[];
}

// Get gallery images by category
export async function getGalleryImagesByCategory(category: string) {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('category', category)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as GalleryImage[];
}

// Get featured gallery images
export async function getFeaturedGalleryImages(limit = 12) {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as GalleryImage[];
}

// Get gallery images for homepage portfolio (featured first, then by display_order)
export async function getGalleryImagesForHomepage(maxLimit: number) {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(maxLimit);

  if (error) throw error;
  return (data || []).map(normalizeGalleryImage) as GalleryImage[];
}

// Get gallery images grouped by row (for homepage polaroid/row layout)
export async function getGalleryImagesByRows(maxRows = 10) {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('row_index', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) throw error;
  const normalized = (data || []).map(normalizeGalleryImage) as GalleryImage[];
  const byRow: GalleryImage[][] = [];
  for (const img of normalized) {
    const ri = img.row_index ?? 0;
    while (byRow.length <= ri) byRow.push([]);
    byRow[ri].push(img);
  }
  return byRow;
}

// Normalize gallery image (row_index may be missing in older DB)
function normalizeGalleryImage(row: Record<string, unknown>): GalleryImage & { row_index?: number } {
  return {
    ...row,
    row_index: typeof row.row_index === 'number' ? row.row_index : 0,
  } as GalleryImage;
}

// Get all categories
export async function getGalleryCategories() {
  const { data, error } = await supabase
    .from('gallery')
    .select('category')
    .not('category', 'is', null);

  if (error) throw error;
  
  // Get unique categories
  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  return categories.sort();
}

// Create gallery image
export async function createGalleryImage(image: Omit<GalleryImage, 'id' | 'created_at' | 'updated_at'>) {
  const payload = {
    ...image,
    row_index: image.row_index ?? 0,
  };
  const { data, error } = await supabase
    .from('gallery')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return normalizeGalleryImage(data || {}) as GalleryImage;
}

// Update gallery image
export async function updateGalleryImage(id: string, updates: Partial<GalleryImage>) {
  const { data, error } = await supabase
    .from('gallery')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalizeGalleryImage(data || {}) as GalleryImage;
}

// Convert category to URL slug (for gallery page links)
export function categoryToGallerySlug(category: string | null): string | null {
  if (!category || !category.trim()) return null;
  return category.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Delete gallery image
export async function deleteGalleryImage(id: string) {
  const { error } = await supabase
    .from('gallery')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Bulk delete gallery images
export async function deleteGalleryImages(ids: string[]) {
  const { error } = await supabase
    .from('gallery')
    .delete()
    .in('id', ids);

  if (error) throw error;
}

// Delete a gallery row: removes all images in that row and shifts subsequent rows down
export async function deleteGalleryRow(rowIndex: number): Promise<void> {
  const { data: allImages, error: fetchError } = await supabase
    .from('gallery')
    .select('id, row_index')
    .order('row_index', { ascending: true })
    .order('display_order', { ascending: true });

  if (fetchError) throw fetchError;
  if (!allImages || allImages.length === 0) return;

  const toDelete = allImages.filter((img) => (img.row_index ?? 0) === rowIndex);
  const toShift = allImages.filter((img) => (img.row_index ?? 0) > rowIndex);

  if (toDelete.length > 0) {
    const idsToDelete = toDelete.map((img) => img.id);
    const { error: delError } = await supabase
      .from('gallery')
      .delete()
      .in('id', idsToDelete);
    if (delError) throw delError;
  }

  const updateResults = await Promise.all(
    toShift.map((img) => {
      const newRowIndex = (img.row_index ?? 0) - 1;
      return supabase
        .from('gallery')
        .update({ row_index: newRowIndex })
        .eq('id', img.id);
    })
  );
  const firstError = updateResults.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
}
