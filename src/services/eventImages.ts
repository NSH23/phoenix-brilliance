import { supabase } from '@/lib/supabase';

export interface EventImage {
  id: string;
  event_id: string;
  url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getEventImages(eventId: string): Promise<EventImage[]> {
  const { data, error } = await supabase
    .from('event_images')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as EventImage[];
}

export async function createEventImage(
  image: Omit<EventImage, 'id' | 'created_at' | 'updated_at'>
): Promise<EventImage> {
  const { data, error } = await supabase
    .from('event_images')
    .insert([image])
    .select()
    .single();

  if (error) throw error;
  return data as EventImage;
}

export async function updateEventImage(
  id: string,
  updates: Partial<EventImage>
): Promise<EventImage> {
  const { data, error } = await supabase
    .from('event_images')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EventImage;
}

export async function deleteEventImage(id: string): Promise<void> {
  const { error } = await supabase.from('event_images').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteEventImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('event_images').delete().in('id', ids);
  if (error) throw error;
}

export async function setEventImages(eventId: string, urls: string[]): Promise<EventImage[]> {
  const existing = await getEventImages(eventId);
  const existingIds = existing.map((e) => e.id);

  await deleteEventImages(existingIds);

  if (urls.length === 0) return [];

  const inserted = await Promise.all(
    urls.map((url, index) =>
      createEventImage({
        event_id: eventId,
        url,
        display_order: index,
      })
    )
  );

  return inserted;
}
