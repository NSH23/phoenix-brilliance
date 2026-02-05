import { supabase } from '@/lib/supabase';

export interface BeforeAfter {
  id: string;
  title: string;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getActiveBeforeAfter(): Promise<BeforeAfter[]> {
  const { data, error } = await supabase
    .from('before_after')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(4);

  if (error) throw error;
  return (data || []) as BeforeAfter[];
}

export async function getAllBeforeAfter(): Promise<BeforeAfter[]> {
  const { data, error } = await supabase
    .from('before_after')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as BeforeAfter[];
}

export async function createBeforeAfter(
  item: Omit<BeforeAfter, 'id' | 'created_at' | 'updated_at'>
): Promise<BeforeAfter> {
  const { data, error } = await supabase
    .from('before_after')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data as BeforeAfter;
}

export async function updateBeforeAfter(
  id: string,
  updates: Partial<BeforeAfter>
): Promise<BeforeAfter> {
  const { data, error } = await supabase
    .from('before_after')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BeforeAfter;
}

export async function deleteBeforeAfter(id: string): Promise<void> {
  const { error } = await supabase.from('before_after').delete().eq('id', id);
  if (error) throw error;
}
