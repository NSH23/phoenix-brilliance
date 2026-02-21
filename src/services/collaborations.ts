import { supabase } from '@/lib/supabase';

/** Ensure the current session is present (required for admin-only RLS on collaboration_images). */
async function requireSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('You must be logged in to add or edit collaboration images. Please sign in again.');
  }
}

export interface Collaboration {
  id: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
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
  folder_id: string | null;
  image_url: string;
  caption: string | null;
  display_order: number;
  media_type: 'image' | 'video';
  created_at: string;
  updated_at: string;
}

export interface CollaborationFolder {
  id: string;
  collaboration_id: string;
  parent_id: string | null;
  name: string;
  display_order: number;
  is_enabled: boolean;
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

// Get collaboration by ID with images, folders, and steps.
// Normalizes nested relations so collaboration_images and collaboration_folders are always arrays (sorted).
export async function getCollaborationById(id: string) {
  const { data, error } = await supabase
    .from('collaborations')
    .select(`
      *,
      collaboration_images (*),
      collaboration_folders (*),
      collaboration_steps (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return data;

  const raw = data as Record<string, unknown>;
  const images = raw.collaboration_images ?? raw.collaborationImages ?? [];
  const folders = raw.collaboration_folders ?? raw.collaborationFolders ?? [];
  const steps = raw.collaboration_steps ?? raw.collaborationSteps ?? [];

  const imagesArr = Array.isArray(images)
    ? [...images].sort((a: { display_order?: number }, b: { display_order?: number }) => (a?.display_order ?? 0) - (b?.display_order ?? 0))
    : [];
  const foldersArr = Array.isArray(folders)
    ? [...folders].sort((a: { display_order?: number }, b: { display_order?: number }) => (a?.display_order ?? 0) - (b?.display_order ?? 0))
    : [];
  const stepsArr = Array.isArray(steps)
    ? [...steps].sort((a: { step_number?: number }, b: { step_number?: number }) => (a?.step_number ?? 0) - (b?.step_number ?? 0))
    : [];

  return {
    ...data,
    collaboration_images: imagesArr,
    collaboration_folders: foldersArr,
    collaboration_steps: stepsArr,
  };
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

/** Build a clear error message for DB/Supabase errors (e.g. 409 FK violation). */
function formatCollaborationImageError(error: { code?: string; message?: string; details?: string }, context: 'insert' | 'update'): Error {
  const code = error?.code ?? '';
  const msg = error?.message ?? '';
  const details = error?.details ?? '';
  const isFk = code === '23503' || /23503|foreign key|foreign_key/i.test(msg);
  if (isFk) {
    const friendly = context === 'insert'
      ? 'Foreign key violation: the folder or collaboration does not exist (e.g. folder was deleted). Save images without a folder first, then assign to a folder and save again.'
      : 'Foreign key violation: the folder does not exist. Move the image out of the folder and save again.';
    return new Error(`${friendly} ${details ? `Details: ${details}` : ''}`.trim());
  }
  return new Error(details ? `${msg} — ${details}` : msg || 'Failed to save collaboration image.');
}

export async function createCollaborationImage(image: Omit<CollaborationImage, 'id' | 'created_at' | 'updated_at'>) {
  await requireSession();
  let folderId: string | null = image.folder_id != null && image.folder_id !== '' && !String(image.folder_id).startsWith('temp-')
    ? image.folder_id
    : null;

  // Defensive: ensure folder exists and belongs to this collaboration so we never hit 23503
  if (folderId) {
    const { data: folders } = await supabase
      .from('collaboration_folders')
      .select('id')
      .eq('collaboration_id', image.collaboration_id)
      .eq('id', folderId)
      .maybeSingle();
    if (!folders) folderId = null;
  }

  const payload: Record<string, unknown> = {
    collaboration_id: image.collaboration_id,
    image_url: image.image_url,
    caption: image.caption ?? null,
    display_order: Number(image.display_order),
    media_type: image.media_type ?? 'image',
    ...(folderId != null && { folder_id: folderId }),
  };
  const { data, error } = await supabase
    .from('collaboration_images')
    .insert([payload])
    .select()
    .single();

  if (error) {
    const err = error as { code?: string; message?: string; details?: string };
    throw formatCollaborationImageError(err, 'insert');
  }
  return data as CollaborationImage;
}

export async function updateCollaborationImage(id: string, updates: Partial<Pick<CollaborationImage, 'folder_id' | 'caption' | 'display_order' | 'media_type'>>) {
  await requireSession();
  const payload: Record<string, unknown> = { ...updates };
  if ('folder_id' in payload) {
    const v = payload.folder_id;
    if (v == null || v === '' || (typeof v === 'string' && v.startsWith('temp-'))) {
      payload.folder_id = null;
    }
  }
  const { data, error } = await supabase
    .from('collaboration_images')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    const err = error as { code?: string; message?: string; details?: string };
    throw formatCollaborationImageError(err, 'update');
  }
  // 409 / 0 rows can occur if RLS blocks the update; surface a clear error
  if (data == null) {
    throw new Error('Update not allowed or image not found. Ensure you are logged in and your user is listed in admin_users.');
  }
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

// Collaboration Folders (for gallery folder/subfolder structure)
export async function getCollaborationFolders(collaborationId: string) {
  const { data, error } = await supabase
    .from('collaboration_folders')
    .select('*')
    .eq('collaboration_id', collaborationId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as CollaborationFolder[];
}

export async function createCollaborationFolder(folder: Omit<CollaborationFolder, 'id' | 'created_at' | 'updated_at'>) {
  await requireSession();
  const payload = {
    collaboration_id: folder.collaboration_id,
    parent_id: folder.parent_id ?? null,
    name: String(folder.name).trim() || 'Unnamed folder',
    display_order: Number(folder.display_order) || 0,
  };
  const { data, error } = await supabase
    .from('collaboration_folders')
    .insert([payload])
    .select()
    .single();

  if (error) {
    const msg = error.message ?? JSON.stringify(error);
    throw new Error(`Failed to create folder: ${msg}`);
  }
  if (!data) throw new Error('Failed to create folder: no data returned');
  return data as CollaborationFolder;
}

export async function updateCollaborationFolder(id: string, updates: Partial<Pick<CollaborationFolder, 'name' | 'parent_id' | 'display_order' | 'is_enabled'>>) {
  await requireSession();
  const { data, error } = await supabase
    .from('collaboration_folders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CollaborationFolder;
}

export async function deleteCollaborationFolder(id: string) {
  await requireSession();
  const { error } = await supabase
    .from('collaboration_folders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** Seed standard event folders (Wedding, Birthday, etc.) for one collaboration. Idempotent. */
export async function seedCollaborationFolders(collaborationId: string): Promise<void> {
  await requireSession();
  const { error } = await supabase.rpc('seed_collaboration_folders', {
    p_collaboration_id: collaborationId,
  });
  if (error) throw error;
}
