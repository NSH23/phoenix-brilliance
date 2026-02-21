import { supabase } from '@/lib/supabase';

export interface SiteContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  cta_text: string | null;
  cta_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  type: 'text' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

/** About section extended content (stored as JSON in site_content.description for section_key 'about') */
export interface AboutSectionContent {
  tagline: string;
  paragraphs: string[];
  quote: string;
  stats: { value: string; label: string }[];
}

const DEFAULT_ABOUT_BODY: AboutSectionContent = {
  tagline: 'Where vision meets emotion, and every detail becomes a memory.',
  paragraphs: [
    "Kevin, the visionary behind Phoenix Events & Production, started the company in 2017 with a single-minded commitment to excellence in event décor and production. From day one, his philosophy has been clear: every celebration deserves to be crafted with the same care and creativity that he would want for his own.",
    "In 2024, he took a decisive step by launching PnP Production, bringing design and production under one roof. This move was driven by a simple goal: to offer clients superior quality and hassle-free execution from concept to completion. By unifying creative design with hands-on production, Phoenix can now deliver more cohesive, timely, and refined outcomes without the friction of coordinating multiple vendors.",
    "Today, Kevin's leadership and passion have positioned Phoenix Events & Production as a trusted name in the event industry. The company is known not only for beautiful setups and seamless execution but also for the integrity, reliability, and personal touch that he and his team bring to every project.",
  ],
  quote: 'We do not just plan events. We design how they are remembered.',
  stats: [
    { value: '500+', label: 'Events Curated' },
    { value: '12+', label: 'Years of Excellence' },
    { value: '50+', label: 'Premium Partners' },
    { value: '98%', label: 'Client Satisfaction' },
  ],
};

export function parseAboutSectionDescription(description: string | null): AboutSectionContent {
  if (!description || typeof description !== 'string') return DEFAULT_ABOUT_BODY;
  try {
    const parsed = JSON.parse(description) as Partial<AboutSectionContent>;
    return {
      tagline: typeof parsed.tagline === 'string' ? parsed.tagline : DEFAULT_ABOUT_BODY.tagline,
      paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs.filter((p): p is string => typeof p === 'string') : DEFAULT_ABOUT_BODY.paragraphs,
      quote: typeof parsed.quote === 'string' ? parsed.quote : DEFAULT_ABOUT_BODY.quote,
      stats: Array.isArray(parsed.stats)
        ? parsed.stats
            .filter((s): s is { value: string; label: string } => s && typeof s.value === 'string' && typeof s.label === 'string')
            .slice(0, 4)
        : DEFAULT_ABOUT_BODY.stats,
    };
  } catch {
    return DEFAULT_ABOUT_BODY;
  }
}

// Site Content
export async function getAllSiteContent() {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section_key', { ascending: true });

  if (error) throw error;
  return data as SiteContent[];
}

export async function getSiteContentByKey(sectionKey: string) {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('section_key', sectionKey)
    .single();

  if (error) throw error;
  return data as SiteContent;
}

export async function updateSiteContent(sectionKey: string, updates: Partial<SiteContent>) {
  const { data, error } = await supabase
    .from('site_content')
    .update(updates)
    .eq('section_key', sectionKey)
    .select()
    .single();

  if (error) throw error;
  return data as SiteContent;
}

export async function upsertSiteContent(content: Partial<SiteContent> & { section_key: string }) {
  const { data, error } = await supabase
    .from('site_content')
    .upsert(content, { onConflict: 'section_key' })
    .select()
    .single();

  if (error) throw error;
  return data as SiteContent;
}

// Site Settings
export async function getAllSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) throw error;
  return data as SiteSetting[];
}

export async function getSiteSetting(key: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single();

  if (error) throw error;
  return data as SiteSetting;
}

export async function getSiteSettingOptional(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return data?.value ?? null;
}

export async function upsertSiteSetting(
  key: string,
  value: string,
  type: SiteSetting['type'] = 'text'
): Promise<SiteSetting> {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key, value, type }, { onConflict: 'key' })
    .select()
    .single();

  if (error) throw error;
  return data as SiteSetting;
}

export async function updateSiteSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .update({ value })
    .eq('key', key)
    .select()
    .single();

  if (error) throw error;
  return data as SiteSetting;
}

// Social Links
export async function getActiveSocialLinks() {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .eq('is_active', true)
    .order('platform', { ascending: true });

  if (error) throw error;
  return data as SocialLink[];
}

export async function getAllSocialLinks() {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('platform', { ascending: true });

  if (error) throw error;
  return data as SocialLink[];
}

export async function updateSocialLink(platform: string, updates: Partial<SocialLink>) {
  const { data, error } = await supabase
    .from('social_links')
    .update(updates)
    .eq('platform', platform)
    .select()
    .single();

  if (error) throw error;
  return data as SocialLink;
}

// Contact Info
export async function getContactInfo() {
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data as ContactInfo;
}

export async function getContactInfoOptional(): Promise<ContactInfo | null> {
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ContactInfo | null;
}

export async function updateContactInfo(updates: Partial<ContactInfo>) {
  const existing = await getContactInfo();
  const { data, error } = await supabase
    .from('contact_info')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;
  return data as ContactInfo;
}

export async function upsertContactInfo(info: { email: string; phone: string; address?: string | null }): Promise<ContactInfo> {
  const existing = await getContactInfoOptional();
  if (existing) {
    return updateContactInfo(info);
  }
  const { data, error } = await supabase
    .from('contact_info')
    .insert([info])
    .select()
    .single();
  if (error) throw error;
  return data as ContactInfo;
}

export async function upsertSocialLink(platform: string, url: string, is_active = true): Promise<SocialLink> {
  const { data, error } = await supabase
    .from('social_links')
    .upsert({ platform, url, is_active }, { onConflict: 'platform' })
    .select()
    .single();
  if (error) throw error;
  return data as SocialLink;
}
