# Complete Deployment Guide - Phoenix Events & Production

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Build Optimization](#build-optimization)
3. [Deployment Platforms](#deployment-platforms)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Domain Configuration](#domain-configuration)
6. [SEO Optimization](#seo-optimization)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Maintenance & Updates](#maintenance--updates)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] Run `npm run build` successfully (no errors)
- [ ] Run `npm run lint` (fix all warnings)
- [ ] Test all pages locally (`npm run preview`)
- [ ] Test admin dashboard functionality
- [ ] Test contact form submission
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify all images load correctly
- [ ] Check all links work

### ✅ Database & Backend
- [ ] All RLS policies fixed (run `fix-all-rls-performance-issues.sql`)
- [ ] All security issues fixed (run `fix-remaining-security-issues.sql`)
- [ ] Supabase project configured
- [ ] Database migrations applied
- [ ] Storage buckets configured
- [ ] Email service configured (if using Supabase Auth)

### ✅ Environment Variables
- [ ] `.env.example` file created
- [ ] Production environment variables documented
- [ ] Secrets stored securely (not in code)

### ✅ SEO & Content
- [ ] `sitemap.xml` updated with actual domain
- [ ] `robots.txt` configured
- [ ] Meta tags added to all pages
- [ ] Open Graph tags configured
- [ ] Structured data (JSON-LD) added

---

## 🏗️ Build Optimization

### Step 1: Final Build Test

```bash
# Clean previous builds
rm -rf dist

# Build for production
npm run build

# Test production build locally
npm run preview
```

### Step 2: Verify Build Output

Check `dist/` folder:
- ✅ All assets generated
- ✅ Chunks properly split
- ✅ No large files (>500KB)
- ✅ Source maps disabled (for production)

### Step 3: Build Size Analysis

```bash
# Install bundle analyzer (optional)
npm install --save-dev rollup-plugin-visualizer

# Check bundle sizes
du -sh dist/*
```

**Target Sizes:**
- Main bundle: < 200KB (gzipped)
- Vendor chunks: < 300KB each
- Total initial load: < 500KB

---

## 🚀 Deployment Platforms

### Option 1: Vercel (Recommended) ⭐

**Why Vercel:**
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments
- ✅ Analytics included
- ✅ Free tier available

#### Deployment Steps:

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository
   - Configure:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

3. **Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Select "Production", "Preview", and "Development"

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Get your deployment URL

5. **Custom Domain:**
   - Go to Project Settings → Domains
   - Add your domain
   - Follow DNS configuration instructions

---

### Option 2: Netlify

**Why Netlify:**
- ✅ Easy deployment
- ✅ Form handling
- ✅ Serverless functions
- ✅ Free tier available

#### Deployment Steps:

1. **Deploy via Dashboard:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub
   - Click "New site from Git"
   - Select your repository
   - Configure:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
     - **Base directory:** (leave empty)

2. **Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy:**
   - Click "Deploy site"
   - Wait for build
   - Get your deployment URL

4. **Custom Domain:**
   - Go to Domain Settings → Add custom domain
   - Follow DNS instructions

---

### Option 3: Cloudflare Pages

**Why Cloudflare:**
- ✅ Fast global CDN
- ✅ Free SSL
- ✅ Unlimited bandwidth
- ✅ Free tier available

#### Deployment Steps:

1. **Deploy via Dashboard:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project"
   - Connect GitHub repository
   - Configure:
     - **Framework preset:** Vite
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`

2. **Environment Variables:**
   - Go to Settings → Environment Variables
   - Add production variables

3. **Deploy:**
   - Click "Save and Deploy"
   - Wait for build

---

## 🔐 Environment Variables Setup

### Required Variables

Create `.env.production` (for local testing):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Setting in Deployment Platform

**Vercel:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)

**Netlify:**
1. Site Settings → Environment Variables
2. Add each variable
3. Set scope (Production, Deploy previews, Branch deploys)

**Cloudflare Pages:**
1. Settings → Environment Variables
2. Add each variable
3. Set environment (Production, Preview)

### Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use platform's environment variable management
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/staging/production
- ✅ Restrict Supabase RLS policies

---

## 🌐 Domain Configuration

### Step 1: Purchase Domain

Recommended registrars:
- Namecheap
- Google Domains
- Cloudflare Registrar

### Step 2: Configure DNS

#### For Vercel:

1. **Add Domain in Vercel:**
   - Project Settings → Domains
   - Add your domain (e.g., `phoenixevents.com`)
   - Vercel will show DNS records

2. **Update DNS Records:**
   - Go to your domain registrar
   - Add DNS records:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

3. **Wait for Propagation:**
   - DNS changes take 24-48 hours
   - Check with: `nslookup yourdomain.com`

#### For Netlify:

1. **Add Domain:**
   - Domain Settings → Add custom domain
   - Enter your domain

2. **Configure DNS:**
   - Netlify will show DNS records
   - Add to your registrar:
     ```
     Type: A
     Name: @
     Value: (Netlify IP)
     
     Type: CNAME
     Name: www
     Value: (Netlify domain)
     ```

### Step 3: SSL Certificate

- ✅ Automatic HTTPS (Vercel/Netlify/Cloudflare)
- ✅ Force HTTPS redirect
- ✅ HSTS enabled

### Step 4: Update Sitemap & Robots.txt

Update `public/sitemap.xml`:
```xml
<url>
  <loc>https://yourdomain.com/</loc>
  ...
</url>
```

Update `public/robots.txt`:
```
Sitemap: https://yourdomain.com/sitemap.xml
```

---

## 🔍 SEO Optimization

### 1. Meta Tags (Already Implemented)

✅ Using `react-helmet-async`  
✅ SEO component created  
✅ Meta tags on all pages

### 2. Update Domain in SEO Component

Update `src/components/SEO.tsx`:
```typescript
const baseUrl = 'https://yourdomain.com'; // Update this
```

### 3. Structured Data

✅ Organization schema implemented  
✅ Event schema implemented  
✅ JSON-LD format

### 4. Sitemap Submission

1. **Google Search Console:**
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add property (your domain)
   - Verify ownership
   - Submit sitemap: `https://yourdomain.com/sitemap.xml`

2. **Bing Webmaster Tools:**
   - Go to [bing.com/webmasters](https://bing.com/webmasters)
   - Add site
   - Submit sitemap

### 5. Performance Optimization

- ✅ Code splitting implemented
- ✅ Lazy loading images
- ✅ Optimized bundle sizes
- ✅ CDN delivery

### 6. Content Optimization

- ✅ Unique titles for each page
- ✅ Descriptive meta descriptions
- ✅ Alt text on images
- ✅ Semantic HTML

### 7. Social Media Tags

Update `index.html`:
```html
<meta property="og:url" content="https://yourdomain.com" />
<meta property="og:image" content="https://yourdomain.com/logo.png" />
```

---

## ⚡ Performance Optimization

### 1. Image Optimization

**Before Deployment:**
- Compress all images
- Use WebP format where possible
- Add `loading="lazy"` (already done)

**Tools:**
- [TinyPNG](https://tinypng.com)
- [Squoosh](https://squoosh.app)

### 2. Font Optimization

✅ Using `@fontsource` (self-hosted)  
✅ Fonts preloaded in `index.html`

### 3. Caching Strategy

**Vercel/Netlify automatically:**
- ✅ Cache static assets
- ✅ Enable compression (gzip/brotli)
- ✅ CDN caching

### 4. Service Worker (Optional)

For PWA features:
```bash
npm install vite-plugin-pwa
```

### 5. Monitoring Performance

Use:
- Google PageSpeed Insights
- Lighthouse (Chrome DevTools)
- WebPageTest

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 📊 Monitoring & Analytics

### 1. Google Analytics

Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Error Tracking

**Sentry (Recommended):**
```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### 3. Uptime Monitoring

Services:
- [UptimeRobot](https://uptimerobot.com) (Free)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

### 4. Performance Monitoring

- Vercel Analytics (built-in)
- Google Analytics
- Real User Monitoring (RUM)

---

## 🔧 Maintenance & Updates

### Zero-Downtime Deployment Strategy

#### Method 1: Preview Deployments (Recommended)

**Vercel/Netlify:**
1. Create feature branch
2. Make changes
3. Push to GitHub
4. Preview deployment created automatically
5. Test preview URL
6. Merge to main → Production deployment

**Benefits:**
- ✅ Test before production
- ✅ No downtime
- ✅ Easy rollback

#### Method 2: Blue-Green Deployment

1. Deploy new version to staging
2. Test thoroughly
3. Switch traffic to new version
4. Keep old version as backup

### Update Process

#### Step 1: Prepare Changes

```bash
# Create feature branch
git checkout -b update/feature-name

# Make changes
# Test locally
npm run dev

# Build and test
npm run build
npm run preview
```

#### Step 2: Deploy Preview

```bash
# Push to GitHub
git push origin update/feature-name

# Platform creates preview deployment automatically
# Test preview URL
```

#### Step 3: Deploy to Production

```bash
# Merge to main
git checkout main
git merge update/feature-name
git push origin main

# Platform deploys automatically
# Monitor deployment status
```

#### Step 4: Verify

- ✅ Check production URL
- ✅ Test critical features
- ✅ Monitor error logs
- ✅ Check analytics

### Rollback Procedure

**Vercel:**
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Netlify:**
1. Go to Deploy log
2. Find previous deployment
3. Click "Publish deploy"

**Cloudflare Pages:**
1. Go to Deployments
2. Find previous deployment
3. Click "Retry deployment"

### Database Migrations

**Safe Migration Process:**

1. **Test Locally:**
   ```bash
   # Test migration on local Supabase
   ```

2. **Backup Database:**
   - Supabase Dashboard → Database → Backups
   - Create manual backup

3. **Apply Migration:**
   - Run SQL in Supabase SQL Editor
   - Verify no errors

4. **Test Production:**
   - Test affected features
   - Monitor for errors

5. **Rollback Plan:**
   - Keep backup ready
   - Document rollback SQL

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails

**Error:** Build timeout
**Solution:**
- Check build logs
- Optimize dependencies
- Increase build timeout (if platform allows)

#### 2. Environment Variables Not Working

**Error:** `undefined` values
**Solution:**
- Verify variable names (must start with `VITE_`)
- Check platform environment variable settings
- Redeploy after adding variables

#### 3. Images Not Loading

**Error:** 404 on images
**Solution:**
- Check image paths (use absolute paths)
- Verify images in `public/` folder
- Check CDN configuration

#### 4. API Errors

**Error:** CORS or authentication errors
**Solution:**
- Check Supabase RLS policies
- Verify API keys
- Check CORS settings in Supabase

#### 5. Slow Performance

**Solution:**
- Enable CDN caching
- Optimize images
- Check bundle sizes
- Use lazy loading

### Debugging Production

1. **Check Browser Console:**
   - Open DevTools
   - Check for errors

2. **Check Network Tab:**
   - Verify API calls
   - Check response times

3. **Check Platform Logs:**
   - Vercel: Deployments → Logs
   - Netlify: Deploy log
   - Cloudflare: Functions → Logs

4. **Use Error Tracking:**
   - Sentry dashboard
   - Check error frequency
   - Analyze stack traces

---

## 📝 Post-Deployment Checklist

### Immediate (Day 1)

- [ ] Verify all pages load correctly
- [ ] Test admin dashboard login
- [ ] Test contact form submission
- [ ] Check mobile responsiveness
- [ ] Verify SSL certificate active
- [ ] Submit sitemap to Google
- [ ] Set up monitoring

### Week 1

- [ ] Monitor error logs daily
- [ ] Check analytics
- [ ] Test on different devices
- [ ] Verify SEO indexing
- [ ] Check performance scores
- [ ] Gather user feedback

### Month 1

- [ ] Review analytics data
- [ ] Optimize based on metrics
- [ ] Update content if needed
- [ ] Check for security updates
- [ ] Review performance trends

---

## 🎯 Success Metrics

### Performance Targets

- **Page Load Time:** < 2 seconds
- **Time to Interactive:** < 3 seconds
- **First Contentful Paint:** < 1.5 seconds
- **Lighthouse Score:** > 90

### SEO Targets

- **Google Indexing:** All pages indexed
- **Search Rankings:** Top 10 for target keywords
- **Backlinks:** Growing over time
- **Organic Traffic:** Increasing monthly

### Reliability Targets

- **Uptime:** > 99.9%
- **Error Rate:** < 0.1%
- **API Response Time:** < 500ms

---

## 📞 Support & Resources

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)

### Community

- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://supabase.com/discord)
- [React Community](https://react.dev/community)

---

## ✅ Final Checklist

Before going live:

- [ ] All pre-deployment checks complete
- [ ] Build successful
- [ ] Environment variables configured
- [ ] Domain configured and SSL active
- [ ] Sitemap submitted
- [ ] Analytics configured
- [ ] Error tracking set up
- [ ] Monitoring active
- [ ] Backup strategy in place
- [ ] Team trained on deployment process

---

**🎉 Congratulations! Your website is ready for production!**

For questions or issues, refer to the troubleshooting section or contact support.
