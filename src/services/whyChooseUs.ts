import { supabase } from '@/lib/supabase';

// ─── Reasons ─────────────────────────────────────────────────────────────

export interface WhyChooseUsReason {
  id: string;
  text: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getWhyChooseUsReasons(): Promise<WhyChooseUsReason[]> {
  const { data, error } = await supabase
    .from('why_choose_us_reasons')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as WhyChooseUsReason[];
}

export async function createWhyChooseUsReason(
  payload: Pick<WhyChooseUsReason, 'text' | 'display_order'>
): Promise<WhyChooseUsReason> {
  const { data, error } = await supabase
    .from('why_choose_us_reasons')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsReason;
}

export async function updateWhyChooseUsReason(
  id: string,
  updates: Partial<Pick<WhyChooseUsReason, 'text' | 'display_order'>>
): Promise<WhyChooseUsReason> {
  const { data, error } = await supabase
    .from('why_choose_us_reasons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsReason;
}

export async function deleteWhyChooseUsReason(id: string): Promise<void> {
  const { error } = await supabase
    .from('why_choose_us_reasons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Stats ───────────────────────────────────────────────────────────────

export const WHY_CHOOSE_US_ICON_KEYS = ['trophy', 'heart', 'users', 'shield'] as const;
export type WhyChooseUsIconKey = (typeof WHY_CHOOSE_US_ICON_KEYS)[number];

export interface WhyChooseUsStat {
  id: string;
  stat_value: string;
  stat_label: string;
  stat_description: string | null;
  icon_key: WhyChooseUsIconKey;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getWhyChooseUsStats(): Promise<WhyChooseUsStat[]> {
  const { data, error } = await supabase
    .from('why_choose_us_stats')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as WhyChooseUsStat[];
}

export async function createWhyChooseUsStat(
  payload: Omit<WhyChooseUsStat, 'id' | 'created_at' | 'updated_at'>
): Promise<WhyChooseUsStat> {
  const { data, error } = await supabase
    .from('why_choose_us_stats')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsStat;
}

export async function updateWhyChooseUsStat(
  id: string,
  updates: Partial<
    Pick<
      WhyChooseUsStat,
      'stat_value' | 'stat_label' | 'stat_description' | 'icon_key' | 'display_order'
    >
  >
): Promise<WhyChooseUsStat> {
  const { data, error } = await supabase
    .from('why_choose_us_stats')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WhyChooseUsStat;
}

export async function deleteWhyChooseUsStat(id: string): Promise<void> {
  const { error } = await supabase
    .from('why_choose_us_stats')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
