import { format } from 'date-fns';

/**
 * Format ISO date string from Supabase to local date-time for admin.
 * Supabase returns UTC (e.g. 2025-02-20T10:30:00.000Z); we display in user's local time.
 */
export function formatDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'dd MMM yyyy, h:mm a');
  } catch {
    return '—';
  }
}

/** Date only (no time). */
export function formatDateLocal(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}
