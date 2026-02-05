import { supabase } from '@/lib/supabase';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  message: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Create inquiry (public)
export async function createInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'notes' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('inquiries')
    .insert([{
      ...inquiry,
      status: 'new',
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Inquiry;
}

// Get all inquiries (admin)
export async function getAllInquiries() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Inquiry[];
}

// Get inquiries by status
export async function getInquiriesByStatus(status: Inquiry['status']) {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Inquiry[];
}

// Get inquiry by ID
export async function getInquiryById(id: string) {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Inquiry;
}

// Update inquiry
export async function updateInquiry(id: string, updates: Partial<Inquiry>) {
  const { data, error } = await supabase
    .from('inquiries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Inquiry;
}

// Delete inquiry
export async function deleteInquiry(id: string) {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get inquiry statistics
export async function getInquiryStats() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('status');

  if (error) throw error;

  const stats = {
    new: 0,
    contacted: 0,
    converted: 0,
    closed: 0,
    total: data.length,
  };

  data.forEach((inquiry) => {
    stats[inquiry.status as keyof typeof stats]++;
  });

  return stats;
}
