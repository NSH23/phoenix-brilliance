import { supabase } from '@/lib/supabase';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  powered_by: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventStep {
  id: string;
  event_id: string;
  step_number: number;
  title: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Get all active events
export async function getActiveEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Event[];
}

// Get events for homepage (top N by display_order, with images)
export async function getEventsForHomepage(limit: number) {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_images(*)')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as (Event & { event_images: { id: string; url: string; display_order: number }[] })[];
}

// Get all events (admin)
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Event[];
}

// Get event by ID
export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Event;
}

// Get event by slug
export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as Event;
}

// Get event with steps
export async function getEventWithSteps(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_steps (*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
}

// Create event
export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

// Update event
export async function updateEvent(id: string, updates: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

// Delete event
export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get event steps
export async function getEventSteps(eventId: string) {
  const { data, error } = await supabase
    .from('event_steps')
    .select('*')
    .eq('event_id', eventId)
    .order('step_number', { ascending: true });

  if (error) throw error;
  return data as EventStep[];
}

// Create event step
export async function createEventStep(step: Omit<EventStep, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('event_steps')
    .insert([step])
    .select()
    .single();

  if (error) throw error;
  return data as EventStep;
}

// Update event step
export async function updateEventStep(id: string, updates: Partial<EventStep>) {
  const { data, error } = await supabase
    .from('event_steps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EventStep;
}

// Delete event step
export async function deleteEventStep(id: string) {
  const { error } = await supabase
    .from('event_steps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
