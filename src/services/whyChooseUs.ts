import { supabase } from '@/lib/supabase';

export interface WhyChooseUsStat {
  id: string;
  stat_value: string;
  stat_label: string;
  stat_description: string | null;
  icon_key: 'trophy' | 'heart' | 'users' | 'shield';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface WhyChooseUsReason {
  id: string;
  text: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getWhyChooseUsStats() {
  const { data, error } = await supabase
    .from('why_choose_us_stats')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as WhyChooseUsStat[];
}

export async function getWhyChooseUsReasons() {
  const { data, error } = await supabase
    .from('why_choose_us_reasons')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as WhyChooseUsReason[];
}

export async function updateWhyChooseUsStat(id: string, updates: Partial<WhyChooseUsStat>) {
  const { data, error } = await supabase
    .from('why_choose_us_stats')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsStat;
}

export async function updateWhyChooseUsReason(id: string, updates: Partial<WhyChooseUsReason>) {
  const { data, error } = await supabase
    .from('why_choose_us_reasons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsReason;
}

export async function createWhyChooseUsReason(reason: Omit<WhyChooseUsReason, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('why_choose_us_reasons')
    .insert([reason])
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsReason;
}

export async function deleteWhyChooseUsReason(id: string) {
  const { error } = await supabase
    .from('why_choose_us_reasons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
