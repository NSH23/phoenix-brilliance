import { supabase } from '@/lib/supabase';
import { resolvePublicStorageUrl } from '@/services/storage';

export interface Service {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

function normalizeServiceRow(row: Service): Service {
  return {
    ...row,
    image_url: row.image_url ? resolvePublicStorageUrl(row.image_url, 'service-images') : null,
  };
}

// Get all active services
export async function getActiveServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return ((data || []) as Service[]).map(normalizeServiceRow);
}

// Get all services (admin)
export async function getAllServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return ((data || []) as Service[]).map(normalizeServiceRow);
}

// Create service
export async function createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('services')
    .insert([service])
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

// Update service
export async function updateService(id: string, updates: Partial<Service>) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

// Delete service
export async function deleteService(id: string) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
