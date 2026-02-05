# Critical Fixes Implementation Guide

This guide provides step-by-step instructions for implementing the critical fixes identified in the analysis report.

---

## 1. Remove Debug Code

### Files to Update:
- `src/pages/Index.tsx`

### Steps:
1. Remove the debug logging function and endpoint
2. Remove the useEffect hook that contains debug logging
3. Clean up any debug-related code

### Code Changes:
```typescript
// REMOVE these lines from Index.tsx:
const LOG_ENDPOINT = "http://127.0.0.1:7242/ingest/ce88bfdd-5327-4de6-a23e-fdca7a8385d5";

function logLayout(...) { ... }

// REMOVE the entire useEffect block with debug logging
```

---

## 2. Implement Error Boundaries

### Create New File: `src/components/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto">
                {this.state.error.toString()}
              </pre>
            )}
            <Button onClick={this.handleReset}>Go to Home</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Update `src/App.tsx`:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

// Wrap AppRoutes with ErrorBoundary
function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* ... existing routes ... */}
      </Routes>
    </ErrorBoundary>
  );
}
```

---

## 3. Implement Code Splitting

### Update `src/App.tsx`:

```typescript
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load all route components
const Index = lazy(() => import('./pages/Index'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Public Gallery Pages
const Gallery = lazy(() => import('./pages/Gallery'));
const GalleryEventType = lazy(() => import('./pages/GalleryEventType'));
const GalleryAlbum = lazy(() => import('./pages/GalleryAlbum'));

// Public Events Pages
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));

// Public Collaborations Pages
const Collaborations = lazy(() => import('./pages/Collaborations'));
const CollaborationDetail = lazy(() => import('./pages/CollaborationDetail'));

// Public Services Page
const Services = lazy(() => import('./pages/Services'));

// Admin Pages
const AdminEntry = lazy(() => import('./pages/admin/AdminEntry'));
const LoginRedirect = lazy(() => import('./pages/admin/LoginRedirect'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminEvents = lazy(() => import('./pages/admin/Events'));
const AdminAlbums = lazy(() => import('./pages/admin/Albums'));
const AdminGallery = lazy(() => import('./pages/admin/Gallery'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminCollaborations = lazy(() => import('./pages/admin/Collaborations'));
const AdminTestimonials = lazy(() => import('./pages/admin/Testimonials'));
const AdminInquiries = lazy(() => import('./pages/admin/Inquiries'));
const AdminContent = lazy(() => import('./pages/admin/Content'));
const AdminWhyUs = lazy(() => import('./pages/admin/WhyUs'));
const AdminBeforeAfter = lazy(() => import('./pages/admin/BeforeAfter'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminTeam = lazy(() => import('./pages/admin/Team'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ... existing routes wrapped in Suspense ... */}
      </Routes>
    </Suspense>
  );
}
```

---

## 4. Add Dynamic Meta Tags

### Install react-helmet-async:
```bash
npm install react-helmet-async
```

### Update `src/App.tsx`:

```typescript
import { HelmetProvider } from 'react-helmet-async';

const App = () => (
  <HelmetProvider>
    <TooltipProvider>
      {/* ... rest of app ... */}
    </TooltipProvider>
  </HelmetProvider>
);
```

### Create `src/components/SEO.tsx`:

```typescript
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({ 
  title = 'Phoenix Events & Production',
  description = 'Premium event planning and production services in Pune, Maharashtra',
  image = '/logo.png',
  url,
  type = 'website'
}: SEOProps) {
  const fullTitle = title === 'Phoenix Events & Production' 
    ? title 
    : `${title} | Phoenix Events & Production`;
  
  const fullUrl = url 
    ? `${window.location.origin}${url}` 
    : window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${window.location.origin}${image}`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${window.location.origin}${image}`} />
    </Helmet>
  );
}
```

### Usage in Pages:
```typescript
import { SEO } from '@/components/SEO';

const Events = () => {
  return (
    <>
      <SEO 
        title="Events"
        description="Browse our premium event planning services"
        url="/events"
      />
      {/* ... page content ... */}
    </>
  );
};
```

---

## 5. Add Structured Data (JSON-LD)

### Create `src/components/StructuredData.tsx`:

```typescript
import { Helmet } from 'react-helmet-async';

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
}

export function OrganizationSchema({
  name = 'Phoenix Events & Production',
  url = window.location.origin,
  logo = `${window.location.origin}/logo.png`,
  contactPoint,
  address
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EventPlanningService',
    name,
    url,
    logo,
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
```

### Add to `src/pages/Index.tsx`:

```typescript
import { OrganizationSchema } from '@/components/StructuredData';

const Index = () => {
  return (
    <>
      <OrganizationSchema 
        contactPoint={{
          telephone: '+91-XXXXXXXXXX',
          contactType: 'Customer Service',
          email: 'info@phoenixevents.com'
        }}
        address={{
          addressLocality: 'Pune',
          addressRegion: 'Maharashtra',
          addressCountry: 'IN'
        }}
      />
      {/* ... rest of page ... */}
    </>
  );
};
```

---

## 6. Update Vite Config for Build Optimizations

### Update `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
            ],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'motion-vendor': ['framer-motion'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
        },
      },
      // Enable source maps for production debugging (optional)
      sourcemap: false,
      // Minify
      minify: 'esbuild',
      // Target modern browsers
      target: 'esnext',
    },
  };
});
```

---

## 7. Replace Console Errors with Error Logging

### Create `src/utils/logger.ts`:

```typescript
// Production-safe logging utility

const isDevelopment = import.meta.env.DEV;

export const logger = {
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    }
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  },
  
  warn: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
  },
  
  info: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
  },
};
```

### Replace all `console.error` calls:

```typescript
// Before:
console.error('Error loading gallery:', error);

// After:
import { logger } from '@/utils/logger';
logger.error('Error loading gallery', error, { component: 'GallerySection' });
```

---

## 8. Generate Sitemap.xml

### Create `src/utils/generateSitemap.ts`:

```typescript
// This should be run at build time or via API route

export function generateSitemap(routes: string[]) {
  const baseUrl = 'https://yourdomain.com'; // Replace with actual domain
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}
```

### Create `public/sitemap.xml` manually or via build script:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/events</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/gallery</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/services</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

---

## Implementation Order

1. **Day 1:** Remove debug code, add error boundaries
2. **Day 2:** Implement code splitting, update Vite config
3. **Day 3:** Add dynamic meta tags, structured data
4. **Day 4:** Replace console errors, add logger utility
5. **Day 5:** Generate sitemap, test all changes

---

## Testing Checklist

After implementing each fix:

- [ ] Build succeeds without errors
- [ ] No console errors in production build
- [ ] Error boundaries catch errors gracefully
- [ ] Code splitting reduces initial bundle size
- [ ] Meta tags appear correctly in page source
- [ ] Structured data validates (use Google Rich Results Test)
- [ ] Sitemap.xml is accessible and valid
- [ ] All pages load correctly
- [ ] Admin dashboard works correctly

---

## Notes

- Test thoroughly in development before deploying
- Monitor error logs after deployment
- Consider adding error tracking service (Sentry) for production
- Update sitemap.xml when adding new routes
