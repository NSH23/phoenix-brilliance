/** Default public contact numbers (overridden by Supabase contact_info / site_settings when loaded). */
export const DEFAULT_PHONE_PRIMARY = '+91 88880 82509';
export const DEFAULT_PHONE_SECONDARY = '+91 70665 22509';
export const DEFAULT_WHATSAPP = '918888082509';

export const CONTACT_EMAIL = 'Phoenixeventsandproduction@gmail.com';

export const MAP_ADDRESS =
  'Shop no 1, Phoenix Events and Production, Kailas kondiba Dange Plot, Unit 4, Dange Chowk Rd, nr. CBI Crime Branch, nr. Maruti Suzuki Showroom, Pune, Maharashtra 411033';

export const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_ADDRESS)}&output=embed&zoom=17`;

export const INSTAGRAM_URL =
  'https://www.instagram.com/phoenix_events_and_production?igsh=MW1nMDh4dmg2ZWNvNA==';

export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export function toWhatsAppHref(whatsappDigits: string, message?: string): string {
  const base = `https://wa.me/${whatsappDigits.replace(/\D/g, '')}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
