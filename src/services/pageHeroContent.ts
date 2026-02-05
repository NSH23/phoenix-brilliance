import { supabase } from '@/lib/supabase';

export interface PageHeroStat {
  value: string;
  label: string;
}

export interface PageHeroContent {
  id: string;
  page_key: 'events' | 'gallery' | 'collaborations';
  title: string | null;
  subtitle: string | null;
  description: string | null;
  stats: PageHeroStat[];
  created_at: string;
  updated_at: string;
}

export async function getPageHeroContent(pageKey: 'events' | 'gallery' | 'collaborations'): Promise<PageHeroContent | null> {
  const { data, error } = await supabase
    .from('page_hero_content')
    .select('*')
    .eq('page_key', pageKey)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    stats: Array.isArray(data.stats) ? data.stats : [],
  } as PageHeroContent;
}

export type PageHeroContentInput = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  stats?: PageHeroStat[];
};

export async function upsertPageHeroContent(
  pageKey: 'events' | 'gallery' | 'collaborations',
  input: PageHeroContentInput
): Promise<PageHeroContent> {
  const { data, error } = await supabase
    .from('page_hero_content')
    .upsert(
      {
        page_key: pageKey,
        title: input.title ?? null,
        subtitle: input.subtitle ?? null,
        description: input.description ?? null,
        stats: input.stats ?? [],
      },
      { onConflict: 'page_key' }
    )
    .select()
    .single();

  if (error) throw error;
  return { ...data, stats: Array.isArray(data.stats) ? data.stats : [] } as PageHeroContent;
}
