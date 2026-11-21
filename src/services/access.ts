import { supabase } from '@/lib/supabase';
import { toWhatsAppHref } from '@/lib/contactNumbers';

export const SITE_ACCESS_TOKEN_KEY = 'phoenix_site_access_token';
export const SITE_ACCESS_UNLOCK_KEY = 'phoenix_site_access_unlock';

export type SiteAccessStatus = 'none' | 'pending' | 'verified' | 'expired';

export type SiteAccessState = {
  status: SiteAccessStatus;
  otp_expires_at?: string | null;
  unlock_expires_at?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
  visitor_name?: string | null;
};

export type SiteAccessRequest = {
  id: string;
  inquiry_id: string | null;
  access_token: string;
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  event_type: string | null;
  venue: string | null;
  message: string | null;
  otp_code: string;
  otp_expires_at: string;
  status: string;
  verified_at: string | null;
  unlock_expires_at: string | null;
  created_at: string;
};

function newAccessToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createAccessToken(): string {
  return newAccessToken();
}

export function readStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(SITE_ACCESS_TOKEN_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function storeAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SITE_ACCESS_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAccessSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SITE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(SITE_ACCESS_UNLOCK_KEY);
  } catch {
    // ignore
  }
}

export function storeUnlockExpiry(iso: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SITE_ACCESS_UNLOCK_KEY, iso);
  } catch {
    // ignore
  }
}

export function readUnlockExpiry(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SITE_ACCESS_UNLOCK_KEY);
  } catch {
    return null;
  }
}

export function isLocalUnlockValid(serverUnlockExpiresAt?: string | null): boolean {
  const local = readUnlockExpiry();
  const expiryIso = serverUnlockExpiresAt || local;
  if (!expiryIso) return false;
  const ms = Date.parse(expiryIso);
  if (Number.isNaN(ms)) return false;
  return ms > Date.now();
}

function normalizeStatus(raw: unknown): SiteAccessStatus {
  const value = String(raw || '').toLowerCase();
  if (value === 'pending' || value === 'verified' || value === 'expired') return value;
  if (value === 'approved') return 'verified';
  if (value === 'rejected') return 'expired';
  return 'none';
}

export async function getAccessStatus(token: string | null | undefined): Promise<SiteAccessState> {
  if (!token) return { status: 'none' };

  const { data, error } = await supabase.rpc('get_access_status', { p_token: token });
  if (error) {
    throw new Error(error.message || 'Unable to check access status');
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const row = data as Record<string, unknown>;
    return {
      status: normalizeStatus(row.status),
      otp_expires_at: (row.otp_expires_at as string | null) ?? null,
      unlock_expires_at: (row.unlock_expires_at as string | null) ?? null,
      verified_at: (row.verified_at as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
      visitor_name: (row.visitor_name as string | null) ?? null,
    };
  }

  return { status: 'none' };
}

export async function verifyAccessOtp(token: string, otp: string): Promise<{
  ok: boolean;
  reason?: string;
  unlock_expires_at?: string | null;
}> {
  const { data, error } = await supabase.rpc('verify_site_access_otp', {
    p_token: token,
    p_otp: otp,
  });
  if (error) {
    throw new Error(error.message || 'Unable to verify OTP');
  }

  const row = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  return {
    ok: Boolean(row.ok),
    reason: row.reason != null ? String(row.reason) : undefined,
    unlock_expires_at: (row.unlock_expires_at as string | null) ?? null,
  };
}

export async function getPendingAccessRequests(limit = 20): Promise<SiteAccessRequest[]> {
  const { data, error } = await supabase
    .from('site_access_requests')
    .select(
      'id, inquiry_id, access_token, visitor_name, visitor_phone, visitor_email, event_type, venue, message, otp_code, otp_expires_at, status, verified_at, unlock_expires_at, created_at',
    )
    .eq('status', 'pending')
    .gt('otp_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as SiteAccessRequest[];
}

export async function getAccessRequestById(id: string): Promise<SiteAccessRequest | null> {
  const { data, error } = await supabase
    .from('site_access_requests')
    .select(
      'id, inquiry_id, access_token, visitor_name, visitor_phone, visitor_email, event_type, venue, message, otp_code, otp_expires_at, status, verified_at, unlock_expires_at, created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as SiteAccessRequest) ?? null;
}

/** Opens admin WhatsApp with a prefilled OTP message to the visitor. */
export function buildSendOtpWhatsAppHref(request: Pick<SiteAccessRequest, 'visitor_name' | 'visitor_phone' | 'otp_code'>): string | null {
  const digits = String(request.visitor_phone || '').replace(/\D/g, '');
  if (!digits) return null;
  let phone = digits;
  if (phone.length === 10) phone = `91${phone}`;
  if (phone.startsWith('0') && phone.length === 11) phone = `91${phone.slice(1)}`;

  const name = (request.visitor_name || 'there').trim().split(/\s+/)[0] || 'there';
  const message =
    `Hey ${name}, your Phoenix Events website OTP is: ${request.otp_code}. Please don't share it with anyone.`;

  return toWhatsAppHref(phone, message);
}

export function isOtpStillValid(otpExpiresAt: string | null | undefined): boolean {
  if (!otpExpiresAt) return false;
  const ms = Date.parse(otpExpiresAt);
  if (Number.isNaN(ms)) return false;
  return ms > Date.now();
}
