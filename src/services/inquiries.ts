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
  instagram_id?: string;
  venue?: string;
  is_read?: boolean;
}

const PHONE_10_DIGIT_REGEX = /^\d{10}$/;

/** Accept 10-digit Indian number or with +91 prefix (e.g. 7387340570 or +917387340570). */
export function isValidPhone10(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return PHONE_10_DIGIT_REGEX.test(digits);
  if (digits.length === 12 && digits.startsWith('91')) return PHONE_10_DIGIT_REGEX.test(digits.slice(2));
  return false;
}

/** Normalize to 10 digits for storage (strips +91 if present). */
export function getNormalizedPhone10(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.slice(-10);
}

// Create inquiry (public). Email optional: use placeholder no-email-{timestamp}@phoenix.events if blank.
// Uses INSERT only (no .select()) so anon role does not need SELECT permission — avoids 401 when RLS allows only admins to SELECT.
export async function createInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'notes' | 'created_at' | 'updated_at' | 'is_read'> & { email?: string | null }): Promise<void> {
  const email = inquiry.email?.trim() || `no-email-${Date.now()}@phoenix.events`;
  const payload = {
    name: inquiry.name,
    email,
    phone: inquiry.phone ? getNormalizedPhone10(inquiry.phone) : null,
    message: inquiry.message || 'Lead Capture',
    event_type: inquiry.event_type || null,
    status: 'new' as const,
    is_read: false,
    instagram_id: inquiry.instagram_id || null,
    venue: inquiry.venue || null,
  };
  const { error } = await supabase
    .from('inquiries')
    .insert([payload]);

  if (error) {
    const err = error as { code?: string; message?: string };
    const msg = err.code === 'PGRST301' || err.message?.includes('401')
      ? 'Unable to save. Please try again or contact us via WhatsApp.'
      : err.message || 'Something went wrong.';
    throw new Error(msg);
  }
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

/** Lightweight: unread inquiries for admin header notifications (limit 10, minimal fields). Use this instead of getAllInquiries() for faster layout load. */
export async function getUnreadInquiriesForNotifications(limit = 10): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('id, name, event_type, message, created_at, is_read')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Inquiry[];
}

/** Lightweight: total count of unread inquiries for badge. */
export async function getUnreadInquiriesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
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

// Mark inquiry as read
export async function markInquiryAsRead(id: string) {
  const { error } = await supabase
    .from('inquiries')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
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
    .select('status, is_read');

  if (error) throw error;

  const stats = {
    new: 0,
    contacted: 0,
    converted: 0,
    closed: 0,
    total: data.length,
    unread: 0
  };

  data.forEach((inquiry) => {
    stats[inquiry.status as keyof typeof stats]++;
    if (!inquiry.is_read) {
      stats.unread++;
    }
  });

  return stats;
}
