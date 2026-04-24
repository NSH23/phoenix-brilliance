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

export interface SiteBackgroundImages {
  bg3: string;
  bg5: string;
  bg7: string;
  bg9: string;
  bg1_5: string;
  bg2: string;
  bg12: string;
  dt1: string;
  lgt4: string;
}

interface SiteConfigContextType {
  contact: SiteContact | null;
  socialLinks: SiteSocialLinks;
  logoUrl: string;
  backgroundImages: SiteBackgroundImages;
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
const DEFAULT_BG_BASE = 'https://res.cloudinary.com/dutkr9zku/image/upload/f_auto,q_auto,w_1920/phoenix/backgrounds';
const DEFAULT_BACKGROUND_IMAGES: SiteBackgroundImages = {
  bg3: `${DEFAULT_BG_BASE}/3.jpg`,
  bg5: `${DEFAULT_BG_BASE}/5.jpg`,
  bg7: `${DEFAULT_BG_BASE}/7.jpg`,
  bg9: `${DEFAULT_BG_BASE}/9.jpg`,
  bg1_5: `${DEFAULT_BG_BASE}/1.5.jpg`,
  bg2: `${DEFAULT_BG_BASE}/bg2.jpg`,
  bg12: `${DEFAULT_BG_BASE}/bg12.jpg`,
  dt1: `${DEFAULT_BG_BASE}/dt1.jpg`,
  lgt4: `${DEFAULT_BG_BASE}/lgt4.jpg`,
};

const BG_SETTING_TO_VAR: Array<{ settingKey: string; cssVar: string; field: keyof SiteBackgroundImages }> = [
  { settingKey: 'bg_image_3', cssVar: '--bg-image-3', field: 'bg3' },
  { settingKey: 'bg_image_5', cssVar: '--bg-image-5', field: 'bg5' },
  { settingKey: 'bg_image_7', cssVar: '--bg-image-7', field: 'bg7' },
  { settingKey: 'bg_image_9', cssVar: '--bg-image-9', field: 'bg9' },
  { settingKey: 'bg_image_1_5', cssVar: '--bg-image-1-5', field: 'bg1_5' },
  { settingKey: 'bg_image_bg2', cssVar: '--bg-image-bg2', field: 'bg2' },
  { settingKey: 'bg_image_bg12', cssVar: '--bg-image-bg12', field: 'bg12' },
  { settingKey: 'bg_image_dt1', cssVar: '--bg-image-dt1', field: 'dt1' },
  { settingKey: 'bg_image_lgt4', cssVar: '--bg-image-lgt4', field: 'lgt4' },
];

function applyBackgroundCssVariables(images: SiteBackgroundImages) {
  const root = document.documentElement;
  BG_SETTING_TO_VAR.forEach(({ cssVar, field }) => {
    root.style.setProperty(cssVar, `url('${images[field]}')`);
  });
}

const SITE_CONFIG_STALE_MS = 30 * 60 * 1000; // 30 minutes
const SITE_CONFIG_GC_MS = 60 * 60 * 1000; // 1 hour
let siteConfigCache: { fetchedAt: number; value: SiteConfigContextType } | null = null;

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<SiteContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<SiteSocialLinks>({});
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [backgroundImages, setBackgroundImages] = useState<SiteBackgroundImages>(DEFAULT_BACKGROUND_IMAGES);
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
          setBackgroundImages(cached.backgroundImages);
          applyBackgroundCssVariables(cached.backgroundImages);
          setIsLoading(false);
          return;
        }
        if (siteConfigCache && now - siteConfigCache.fetchedAt > SITE_CONFIG_GC_MS) {
          siteConfigCache = null;
        }

        const [contactData, socialData, logoValue, bgValues] = await Promise.all([
          getContactInfoOptional().catch(() => null),
          getActiveSocialLinks().catch(() => []),
          getSiteSettingOptional('site_logo_url').catch(() => null),
          Promise.all(BG_SETTING_TO_VAR.map(({ settingKey }) => getSiteSettingOptional(settingKey).catch(() => null))),
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
        const nextBackgroundImages: SiteBackgroundImages = {
          ...DEFAULT_BACKGROUND_IMAGES,
        };
        BG_SETTING_TO_VAR.forEach(({ field }, idx) => {
          const value = bgValues[idx];
          if (value && value.trim()) nextBackgroundImages[field] = value.trim();
        });

        setContact(nextContact);
        setSocialLinks(nextSocialLinks);
        setLogoUrl(nextLogoUrl);
        setBackgroundImages(nextBackgroundImages);
        applyBackgroundCssVariables(nextBackgroundImages);

        siteConfigCache = {
          fetchedAt: Date.now(),
          value: {
            contact: nextContact,
            socialLinks: Object.keys(nextSocialLinks).length > 0 ? nextSocialLinks : DEFAULT_SOCIAL,
            logoUrl: nextLogoUrl,
            backgroundImages: nextBackgroundImages,
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
      backgroundImages,
      isLoading,
    };
  }, [contact, socialLinks, logoUrl, backgroundImages, isLoading]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (ctx === undefined) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return ctx;
}
