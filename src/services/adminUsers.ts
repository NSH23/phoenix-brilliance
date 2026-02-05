import { supabase } from '@/lib/supabase';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, name, role, avatar_url, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export async function deleteAdminUser(id: string): Promise<void> {
  const { error } = await supabase.from('admin_users').delete().eq('id', id);
  if (error) throw error;
}

export async function updateAdminUser(
  id: string,
  updates: { name?: string; avatar_url?: string | null }
): Promise<AdminUserRow> {
  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminUserRow;
}
