import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

export function SEO({ 
  title = 'Phoenix Events & Production',
  description = 'Premium event planning and production services in Pune, Maharashtra',
  image = '/logo.png',
  url,
  type = 'website',
  keywords
}: SEOProps) {
  const fullTitle = title === 'Phoenix Events & Production' 
    ? title 
    : `${title} | Phoenix Events & Production`;
  
  const fullUrl = url 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${url}` 
    : (typeof window !== 'undefined' ? window.location.href : '');
  
  const imageUrl = image.startsWith('http') 
    ? image 
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Phoenix Events & Production" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
