import { supabase } from '@/lib/supabase';

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar: string | null;
  rating: number;
  event_type: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Get all testimonials
export async function getAllTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('rating', { ascending: false });

  if (error) throw error;
  return data as Testimonial[];
}

// Get featured testimonials
export async function getFeaturedTestimonials(limit = 6) {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Testimonial[];
}

// Get testimonials by event type
export async function getTestimonialsByEventType(eventType: string) {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('event_type', eventType)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Testimonial[];
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
