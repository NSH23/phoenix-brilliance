import { supabase } from '@/lib/supabase';
import { resolvePublicStorageUrl } from '@/services/storage';

function normEventCover(url: string | null | undefined): string | null {
  if (url == null || url === '') return null;
  return resolvePublicStorageUrl(url, 'event-images') || null;
}

function normEventImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  return resolvePublicStorageUrl(url, 'event-images');
}

type EventWithImages = Event & {
  event_images?: { id: string; url: string; display_order: number }[];
};
const EVENT_COLUMNS = 'id, title, slug, description, short_description, cover_image, powered_by, is_active, display_order, created_at, updated_at';
const EVENT_STEP_COLUMNS = 'id, event_id, step_number, title, description, icon, image_url, created_at, updated_at';

function normalizeEventRow<T extends EventWithImages>(e: T): T {
  return {
    ...e,
    cover_image: normEventCover(e.cover_image),
    event_images: e.event_images?.map((img) => ({
      ...img,
      url: normEventImageUrl(img.url),
    })),
  };
}

function normalizeEventStep(step: EventStep): EventStep {
  return {
    ...step,
    image_url: step.image_url ? resolvePublicStorageUrl(step.image_url, 'event-images') : null,
  };
}

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
    .select(EVENT_COLUMNS)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return ((data || []) as Event[]).map((row) => normalizeEventRow(row as EventWithImages));
}

// Get events for homepage (top N by display_order, with images)
export async function getEventsForHomepage(limit: number) {
  const { data, error } = await supabase
    .from('events')
    .select(`${EVENT_COLUMNS}, event_images(id, url, display_order)`)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return ((data || []) as EventWithImages[]).map(normalizeEventRow);
}

// Get all events (admin)
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .order('display_order', { ascending: true })
    .range(0, 49);

  if (error) throw error;
  return ((data || []) as Event[]).map((row) => normalizeEventRow(row as EventWithImages));
}

export async function getAdminEventsPage(params: {
  page: number;
  pageSize: number;
  searchQuery?: string;
}) {
  const { page, pageSize, searchQuery } = params;
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('events')
    .select(EVENT_COLUMNS, { count: 'exact' })
    .order('display_order', { ascending: true });
  const term = (searchQuery ?? '').trim();
  if (term) {
    query = query.ilike('title', `%${term}%`);
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return {
    data: ((data || []) as Event[]).map((row) => normalizeEventRow(row as EventWithImages)),
    total: count ?? 0,
  };
}

// Get event by ID
export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('id', id)
    .single();

  if (error) throw error;
  return normalizeEventRow(data as EventWithImages);
}

// Get event by slug
export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return normalizeEventRow(data as EventWithImages);
}

// Get event with steps
export async function getEventWithSteps(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`${EVENT_COLUMNS}, event_steps(${EVENT_STEP_COLUMNS})`)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  if (!data) return data;
  const row = data as EventWithImages & { event_steps?: EventStep[] };
  const steps = row.event_steps || [];
  return {
    ...normalizeEventRow(row),
    event_steps: steps.map(normalizeEventStep),
  };
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
    .select(EVENT_STEP_COLUMNS)
    .eq('event_id', eventId)
    .order('step_number', { ascending: true });

  if (error) throw error;
  return ((data || []) as EventStep[]).map(normalizeEventStep);
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
