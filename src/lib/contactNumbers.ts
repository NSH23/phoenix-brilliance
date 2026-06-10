/** Default public contact numbers (overridden by Supabase contact_info / site_settings when loaded). */
export const DEFAULT_PHONE_PRIMARY = '+91 88880 82509';
export const DEFAULT_PHONE_SECONDARY = '+91 70665 22509';
export const DEFAULT_WHATSAPP = '918888082509';

export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export function toWhatsAppHref(whatsappDigits: string, message?: string): string {
  const base = `https://wa.me/${whatsappDigits.replace(/\D/g, '')}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
