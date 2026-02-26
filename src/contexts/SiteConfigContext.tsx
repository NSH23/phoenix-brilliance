import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getContactInfoOptional, getSiteSettingOptional } from '@/services/siteContent';
import { getActiveSocialLinks } from '@/services/siteContent';
import { getPublicUrl } from '@/services/storage';

export interface SiteContact {
  phone: string;
  email: string;
  address: string;
  whatsapp: string; // phone without + for wa.me links
}

export interface SiteSocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

interface SiteConfigContextType {
  contact: SiteContact | null;
  socialLinks: SiteSocialLinks;
  logoUrl: string;
  isLoading: boolean;
}

const MAP_ADDRESS = 'Shop no 1, Phoenix Events and Production, Kailas kondiba Dange Plot, Unit 4, Dange Chowk Rd, nr. CBI Crime Branch, nr. Maruti Suzuki Showroom, Pune, Maharashtra 411033';

/** Placeholder address from DB seed – do not use; show MAP_ADDRESS instead to avoid content flash */
const PLACEHOLDER_ADDRESS = 'Phoenix Events, 123 Event Street, Mumbai, Maharashtra 400001';

function isPlaceholderAddress(addr: string | null | undefined): boolean {
  if (!addr) return true;
  return addr.includes('123 Event Street') || /Mumbai.*400001/i.test(addr) || addr.trim() === PLACEHOLDER_ADDRESS;
}

const DEFAULT_CONTACT: SiteContact = {
  phone: '+91 70667 63276',
  email: 'Phoenixeventsandproduction@gmail.com',
  address: MAP_ADDRESS,
  whatsapp: '917066763276',
};

const DEFAULT_SOCIAL: SiteSocialLinks = {};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<SiteContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<SiteSocialLinks>({});
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [contactData, socialData, logoValue] = await Promise.all([
          getContactInfoOptional().catch(() => null),
          getActiveSocialLinks().catch(() => []),
          getSiteSettingOptional('site_logo_url').catch(() => null),
        ]);
        const socialMap: SiteSocialLinks & { whatsapp?: string } = {};
        socialData.forEach((l) => {
          if (l.platform && l.url) {
            (socialMap as Record<string, string>)[l.platform] = l.url;
          }
        });
        const whatsappUrl = socialMap.whatsapp || '';
        const whatsappNum = whatsappUrl.replace(/\D/g, '') || '917066763276';

        if (contactData) {
          const address = contactData.address && !isPlaceholderAddress(contactData.address)
            ? contactData.address
            : DEFAULT_CONTACT.address;
          setContact({
            phone: contactData.phone || DEFAULT_CONTACT.phone,
            email: contactData.email || DEFAULT_CONTACT.email,
            address,
            whatsapp: whatsappNum,
          });
        } else {
          setContact({
            ...DEFAULT_CONTACT,
            whatsapp: whatsappNum,
          });
        }
        setSocialLinks(socialMap);

        // Logo: use full URL as-is; if it's a path (no http), resolve from site-logo bucket
        if (logoValue && logoValue.trim()) {
          const url = logoValue.startsWith('http') ? logoValue : getPublicUrl('site-logo', logoValue.trim());
          setLogoUrl(url);
        }
      } catch {
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const value: SiteConfigContextType = {
    contact: contact ?? DEFAULT_CONTACT,
    socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : DEFAULT_SOCIAL,
    logoUrl,
    isLoading,
  };

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (ctx === undefined) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return ctx;
}
