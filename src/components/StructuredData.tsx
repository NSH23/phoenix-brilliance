import { Helmet } from 'react-helmet-async';

const getBaseUrl = () =>
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

/** EventPlanningBusiness schema for local SEO (homepage). */
export function EventPlanningBusinessSchema() {
  const baseUrl = getBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EventPlanningBusiness',
    name: 'Phoenix Events & Production',
    url: baseUrl,
    image: `${baseUrl}/logo.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pune',
      addressCountry: 'IN',
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  sameAs?: string[]; // Social media profiles
}

export function OrganizationSchema({
  name = 'Phoenix Events & Production',
  url,
  logo,
  contactPoint,
  address,
  sameAs
}: OrganizationSchemaProps) {
  const baseUrl = getBaseUrl();
  const finalUrl = url || baseUrl;
  const finalLogo = logo || `${baseUrl}/logo.png`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EventPlanningService',
    name,
    url: finalUrl,
    logo: finalLogo,
    ...(contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...contactPoint
      }
    }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        ...address
      }
    }),
    ...(sameAs && sameAs.length > 0 && {
      sameAs
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

interface EventSchemaProps {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
  };
  image?: string;
  organizer?: {
    name?: string;
    url?: string;
  };
}

export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  organizer
}: EventSchemaProps) {
  const baseUrl = getBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    ...(description && { description }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(location && {
      location: {
        '@type': 'Place',
        ...(location.name && { name: location.name }),
        ...(location.address && {
          address: {
            '@type': 'PostalAddress',
            ...location.address
          }
        })
      }
    }),
    ...(image && { image: image.startsWith('http') ? image : `${baseUrl}${image}` }),
    ...(organizer && {
      organizer: {
        '@type': 'Organization',
        ...(organizer.name && { name: organizer.name }),
        ...(organizer.url && { url: organizer.url })
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
