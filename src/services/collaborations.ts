import { supabase } from '@/lib/supabase';

export interface Collaboration {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  location: string | null;
  map_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CollaborationImage {
  id: string;
  collaboration_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CollaborationStep {
  id: string;
  collaboration_id: string;
  step_number: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Get all active collaborations
export async function getActiveCollaborations() {
  const { data, error } = await supabase
    .from('collaborations')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Collaboration[];
}

// Get all collaborations (admin)
export async function getAllCollaborations() {
  const { data, error } = await supabase
    .from('collaborations')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Collaboration[];
}

// Get collaboration by ID with images and steps
export async function getCollaborationById(id: string) {
  const { data, error } = await supabase
    .from('collaborations')
    .select(`
      *,
      collaboration_images (*),
      collaboration_steps (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Create collaboration
export async function createCollaboration(collab: Omit<Collaboration, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('collaborations')
    .insert([collab])
    .select()
    .single();

  if (error) throw error;
  return data as Collaboration;
}

// Update collaboration
export async function updateCollaboration(id: string, updates: Partial<Collaboration>) {
  const { data, error } = await supabase
    .from('collaborations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Collaboration;
}

// Delete collaboration
export async function deleteCollaboration(id: string) {
  const { error } = await supabase
    .from('collaborations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Collaboration Images
export async function getCollaborationImages(collaborationId: string) {
  const { data, error } = await supabase
    .from('collaboration_images')
    .select('*')
    .eq('collaboration_id', collaborationId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as CollaborationImage[];
}

export async function createCollaborationImage(image: Omit<CollaborationImage, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('collaboration_images')
    .insert([image])
    .select()
    .single();

  if (error) throw error;
  return data as CollaborationImage;
}

export async function deleteCollaborationImage(id: string) {
  const { error } = await supabase
    .from('collaboration_images')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Collaboration Steps
export async function getCollaborationSteps(collaborationId: string) {
  const { data, error } = await supabase
    .from('collaboration_steps')
    .select('*')
    .eq('collaboration_id', collaborationId)
    .order('step_number', { ascending: true });

  if (error) throw error;
  return data as CollaborationStep[];
}

export async function createCollaborationStep(step: Omit<CollaborationStep, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('collaboration_steps')
    .insert([step])
    .select()
    .single();

  if (error) throw error;
  return data as CollaborationStep;
}

export async function updateCollaborationStep(id: string, updates: Partial<CollaborationStep>) {
  const { data, error } = await supabase
    .from('collaboration_steps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CollaborationStep;
}

export async function deleteCollaborationStep(id: string) {
  const { error } = await supabase
    .from('collaboration_steps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
