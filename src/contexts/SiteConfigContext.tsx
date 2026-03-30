import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getContactInfoOptional, getSiteSettingOptional } from '@/services/siteContent';
import { getActiveSocialLinks } from '@/services/siteContent';
import { resolvePublicStorageUrl } from '@/services/storage';

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

const SITE_CONFIG_STALE_MS = 10 * 60 * 1000; // 10 minutes
let siteConfigCache: { fetchedAt: number; value: SiteConfigContextType } | null = null;

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<SiteContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<SiteSocialLinks>({});
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const now = Date.now();
        if (siteConfigCache && now - siteConfigCache.fetchedAt < SITE_CONFIG_STALE_MS) {
          const cached = siteConfigCache.value;
          setContact(cached.contact);
          setSocialLinks(cached.socialLinks);
          setLogoUrl(cached.logoUrl);
          setIsLoading(false);
          return;
        }

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

        const nextContact: SiteContact = contactData
          ? (() => {
              const address =
                contactData.address && !isPlaceholderAddress(contactData.address)
                  ? contactData.address
                  : DEFAULT_CONTACT.address;
              return {
                phone: contactData.phone || DEFAULT_CONTACT.phone,
                email: contactData.email || DEFAULT_CONTACT.email,
                address,
                whatsapp: whatsappNum,
              };
            })()
          : {
              ...DEFAULT_CONTACT,
              whatsapp: whatsappNum,
            };

        const nextSocialLinks: SiteSocialLinks = socialMap;

        const nextLogoUrl =
          logoValue && logoValue.trim() ? resolvePublicStorageUrl(logoValue.trim(), 'site-logo') : '';

        setContact(nextContact);
        setSocialLinks(nextSocialLinks);
        setLogoUrl(nextLogoUrl);

        siteConfigCache = {
          fetchedAt: Date.now(),
          value: {
            contact: nextContact,
            socialLinks: Object.keys(nextSocialLinks).length > 0 ? nextSocialLinks : DEFAULT_SOCIAL,
            logoUrl: nextLogoUrl,
            isLoading: false,
          },
        };
      } catch {
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const value = useMemo<SiteConfigContextType>(() => {
    return {
      contact: contact ?? DEFAULT_CONTACT,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : DEFAULT_SOCIAL,
      logoUrl,
      isLoading,
    };
  }, [contact, socialLinks, logoUrl, isLoading]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (ctx === undefined) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return ctx;
}
