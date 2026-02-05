import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getContactInfoOptional } from '@/services/siteContent';
import { getActiveSocialLinks } from '@/services/siteContent';

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
  isLoading: boolean;
}

const DEFAULT_CONTACT: SiteContact = {
  phone: '+91 70667 63276',
  email: 'hello@phoenixevents.com',
  address: 'Pune, Maharashtra',
  whatsapp: '917066763276',
};

const DEFAULT_SOCIAL: SiteSocialLinks = {};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<SiteContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<SiteSocialLinks>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [contactData, socialData] = await Promise.all([
          getContactInfoOptional().catch(() => null),
          getActiveSocialLinks().catch(() => []),
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
          setContact({
            phone: contactData.phone || '',
            email: contactData.email || '',
            address: contactData.address || '',
            whatsapp: whatsappNum,
          });
        } else {
          setContact({
            ...DEFAULT_CONTACT,
            whatsapp: whatsappNum,
          });
        }
        setSocialLinks(socialMap);
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
