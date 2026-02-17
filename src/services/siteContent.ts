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
