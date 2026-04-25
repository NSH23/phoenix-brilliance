import { supabase } from '@/lib/supabase';
import { resolvePublicStorageUrl } from '@/services/storage';

function normalizeTestimonialRow(row: Testimonial): Testimonial {
  if (!row.avatar_url?.trim()) return row;
  return {
    ...row,
    avatar_url: resolvePublicStorageUrl(row.avatar_url, 'testimonial-avatars'),
  };
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url?: string;
  created_at: string;
  event_type?: string;
  message?: string; // Legacy/Alternative field
  is_featured?: boolean;
  display_order?: number;
}
const TESTIMONIAL_COLUMNS = 'id, name, role, content, rating, avatar_url, created_at, event_type, message, is_featured, display_order';

// Get all testimonials
export async function getAllTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select(TESTIMONIAL_COLUMNS)
    .order('display_order', { ascending: true })
    .order('rating', { ascending: false })
    .range(0, 49);

  if (error) throw error;
  return ((data || []) as Testimonial[]).map(normalizeTestimonialRow);
}

export async function getAdminTestimonialsPage(params: {
  page: number;
  pageSize: number;
  searchQuery?: string;
  eventType?: string;
}) {
  const { page, pageSize, searchQuery, eventType } = params;
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('testimonials')
    .select(TESTIMONIAL_COLUMNS, { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('rating', { ascending: false });
  const term = (searchQuery ?? '').trim();
  if (term) {
    const escaped = term.replace(/,/g, ' ');
    query = query.or(`name.ilike.%${escaped}%,content.ilike.%${escaped}%`);
  }
  if (eventType && eventType !== 'all') {
    query = query.eq('event_type', eventType);
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return {
    data: ((data || []) as Testimonial[]).map(normalizeTestimonialRow),
    total: count ?? 0,
  };
}

// Get featured testimonials
export async function getFeaturedTestimonials(limit = 6) {
  const { data, error } = await supabase
    .from('testimonials')
    .select(TESTIMONIAL_COLUMNS)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data || []) as Testimonial[]).map(normalizeTestimonialRow);
}

// Get testimonials by event type
export async function getTestimonialsByEventType(eventType: string) {
  const { data, error } = await supabase
    .from('testimonials')
    .select(TESTIMONIAL_COLUMNS)
    .eq('event_type', eventType)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as Testimonial[]).map(normalizeTestimonialRow);
}

// Create testimonial
export async function createTestimonial(testimonial: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('testimonials')
    .insert([testimonial])
    .select()
    .single();

  if (error) throw error;
  return data as Testimonial;
}

// Update testimonial
export async function updateTestimonial(id: string, updates: Partial<Testimonial>) {
  const { data, error } = await supabase
    .from('testimonials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Testimonial;
}

// Delete testimonial
export async function deleteTestimonial(id: string) {
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
