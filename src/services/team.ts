import { supabase } from '@/lib/supabase';
import { deleteFile, createSignedUrl, deleteTeamPhoto } from '@/services/storage';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  designation: string;
  aadhaar_card: string | null;
  age: number | null;
  salary: number | null;
  join_date: string | null;
  department: string | null;
  emergency_contact: string | null;
  notes: string | null;
  photo_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TeamStats {
  total: number;
  active: number;
  inactive: number;
  thisMonth: number;
}

export type TeamMemberInput = {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  designation: string;
  aadhaar_card?: string | null;
  age?: number | null;
  salary?: number | null;
  join_date?: string | null;
  department?: string | null;
  emergency_contact?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  display_order?: number;
};

export interface TeamDocument {
  id: string;
  team_id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TeamMember[];
}

export async function getTeamById(id: string): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from('team')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as TeamMember | null;
}

export async function getTeamStats(): Promise<TeamStats> {
  const { data: all, error: e1 } = await supabase.from('team').select('id, is_active, created_at');
  if (e1) throw e1;

  const list = (all ?? []) as { id: string; is_active: boolean; created_at: string }[];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = list.length;
  const active = list.filter((x) => x.is_active).length;
  const inactive = total - active;
  const thisMonth = list.filter((x) => new Date(x.created_at) >= startOfMonth).length;

  return { total, active, inactive, thisMonth };
}

export async function createTeamMember(input: TeamMemberInput): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team')
    .insert([
      {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        designation: input.designation.trim(),
        aadhaar_card: input.aadhaar_card?.trim() || null,
        age: input.age ?? null,
        salary: input.salary ?? null,
        join_date: input.join_date || null,
        department: input.department?.trim() || null,
        emergency_contact: input.emergency_contact?.trim() || null,
        notes: input.notes?.trim() || null,
        photo_url: input.photo_url?.trim() || null,
        is_active: input.is_active ?? true,
        display_order: input.display_order ?? 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as TeamMember;
}

export async function updateTeamMember(id: string, input: Partial<TeamMemberInput>): Promise<TeamMember> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.email !== undefined) payload.email = input.email.trim();
  if (input.phone !== undefined) payload.phone = input.phone?.trim() || null;
  if (input.address !== undefined) payload.address = input.address?.trim() || null;
  if (input.designation !== undefined) payload.designation = input.designation.trim();
  if (input.aadhaar_card !== undefined) payload.aadhaar_card = input.aadhaar_card?.trim() || null;
  if (input.age !== undefined) payload.age = input.age;
  if (input.salary !== undefined) payload.salary = input.salary;
  if (input.join_date !== undefined) payload.join_date = input.join_date || null;
  if (input.department !== undefined) payload.department = input.department?.trim() || null;
  if (input.emergency_contact !== undefined) payload.emergency_contact = input.emergency_contact?.trim() || null;
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;
  if (input.photo_url !== undefined) payload.photo_url = input.photo_url?.trim() || null;
  if (input.is_active !== undefined) payload.is_active = input.is_active;
  if (input.display_order !== undefined) payload.display_order = input.display_order;

  const { data, error } = await supabase
    .from('team')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TeamMember;
}

export async function deleteTeamMember(id: string): Promise<void> {
  await deleteTeamDocumentsByTeamId(id);
  await deleteTeamPhoto(id);
  const { error } = await supabase.from('team').delete().eq('id', id);
  if (error) throw error;
}

// --- Team documents ---

export async function getTeamDocuments(teamId: string): Promise<TeamDocument[]> {
  const { data, error } = await supabase
    .from('team_documents')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TeamDocument[];
}

export async function createTeamDocument(
  teamId: string,
  input: { name: string; file_path: string; file_type?: string | null }
): Promise<TeamDocument> {
  const { data, error } = await supabase
    .from('team_documents')
    .insert([{ team_id: teamId, name: input.name.trim(), file_path: input.file_path, file_type: input.file_type ?? null }])
    .select()
    .single();
  if (error) throw error;
  return data as TeamDocument;
}

export async function deleteTeamDocument(id: string): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from('team_documents')
    .select('file_path')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  if (data?.file_path) {
    try {
      await deleteFile('team-documents', data.file_path);
    } catch (_) { /* best-effort */ }
  }
  const { error } = await supabase.from('team_documents').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteTeamDocumentsByTeamId(teamId: string): Promise<void> {
  const docs = await getTeamDocuments(teamId);
  for (const d of docs) {
    try {
      await deleteFile('team-documents', d.file_path);
    } catch (_) { /* best-effort */ }
  }
  const { error } = await supabase.from('team_documents').delete().eq('team_id', teamId);
  if (error) throw error;
}

export async function getTeamDocumentDownloadUrl(filePath: string, expiresIn = 60): Promise<string> {
  return createSignedUrl('team-documents', filePath, expiresIn);
}

/** Signed URL for team-photos (private bucket). Use for display in admin. */
export async function getTeamPhotoUrl(path: string, expiresIn = 3600): Promise<string> {
  return createSignedUrl('team-photos', path, expiresIn);
}
