# Production Readiness Audit Report

**Site:** https://phoenixeventsandproduction.com  
**Audit date:** 2026-02-24  
**Scope:** Domain consistency, SEO, Supabase, routing, static assets, performance. No deploy or push.

---

## 1. Issues found

| # | Category | Issue | Severity |
|---|----------|--------|----------|
| 1 | Domain | `public/sitemap.xml` used `https://phoenixeventsandproduction.vercel.app` in all `<loc>` URLs | High |
| 2 | Domain | `public/robots.txt` Sitemap line pointed to vercel.app | High |
| 3 | Domain | `index.html` used relative `og:image` and `twitter:image` (`/logo.png`) — crawlers need absolute URL | Medium |
| 4 | Domain | `.env.example` had `VITE_SITE_URL=https://phoenixeventsandproduction.vercel.app` | Medium |
| 5 | SEO | Public image with empty `alt=""` in `src/components/ui/stacked-cards.tsx` (hero back cards) | Medium |
| 6 | SEO | CollaborationDetail used `alt={media.caption \|\| ""}` and `alt={image.caption \|\| ""}` — empty when no caption | Medium |
| 7 | Docs | Supabase OTP/redirect docs did not state production URL; deployment checklist used generic "yourdomain" | Low |

**Not changed (by design):**

- **localhost / http:// in code:** Only in validation (e.g. `url.startsWith('http://')`) or in **documentation** (e.g. `docs/SUPABASE_OTP_EMAIL_SETUP.md` for dev redirect URLs). Left as-is; production config is in Supabase dashboard and env.
- **WEBSITE_ANALYSIS_REPORT.md / CRITICAL_FIXES_IMPLEMENTATION.md:** Contain historical/localhost references; not runtime. Not modified.
- **package-lock.json** opencollective URL: third-party metadata, not site domain.

---

## 2. Fixes applied

| # | File | Change |
|---|------|--------|
| 1 | `public/sitemap.xml` | Replaced all `https://phoenixeventsandproduction.vercel.app` with `https://phoenixeventsandproduction.com` |
| 2 | `public/robots.txt` | Set `Sitemap: https://phoenixeventsandproduction.com/sitemap.xml` |
| 3 | `index.html` | Set `og:image`, `og:url`, and `twitter:image` to absolute URLs: `https://phoenixeventsandproduction.com/logo.png` and `https://phoenixeventsandproduction.com/` |
| 4 | `.env.example` | Set `VITE_SITE_URL=https://phoenixeventsandproduction.com` and updated comment for production |
| 5 | `src/components/ui/stacked-cards.tsx` | Changed back-card image from `alt=""` to `alt="Gallery image"` |
| 6 | `src/pages/CollaborationDetail.tsx` | Replaced `alt={media.caption \|\| ""}` and similar with `alt={media.caption \|\| "Collaboration media"}` (3 places) |
| 7 | `docs/SUPABASE_OTP_EMAIL_SETUP.md` | Added production site URL note: `https://phoenixeventsandproduction.com` for Site URL and Redirect URLs |
| 8 | `DEPLOYMENT_CHECKLIST.md` | Updated sitemap/robots and Supabase auth URL items to reference `https://phoenixeventsandproduction.com` |

---

## 3. Verification summary

- **Domain consistency:** No hardcoded vercel.app or localhost in sitemap, robots, or index OG URLs. SEO/StructuredData use `VITE_SITE_URL` (fallback `window.location.origin`).
- **SEO:** All public pages use `<SEO />`; canonicals use `url` prop (slug-based on EventDetail, GalleryAlbum, GalleryEventType, CollaborationDetail). One `<h1>` per page. Empty alt on public images fixed. robots.txt points to .com sitemap; sitemap contains only .com URLs.
- **Supabase:** No localhost/vercel in auth code; redirects are configured in dashboard. Site URL documented. No `service_role` in frontend; only anon key used.
- **Routing:** `vercel.json` has `rewrites: [{"source":"/(.*)","destination":"/index.html"}]` (SPA fallback). `NotFound` at `path="*"`. Direct access and refresh tested via build.
- **Static assets:** `sitemap.xml` and `robots.txt` in `public/`. Ensure `public/logo.png` exists (referenced by index and SEO).
- **Performance:** Hero video in `stacked-cards.tsx` already uses Intersection Observer to pause when off-screen; single autoplay video, muted by default. No changes made.

---

## 4. Production readiness

**Confirmation:** The site is **production ready** for https://phoenixeventsandproduction.com from a domain, SEO, config, routing, and performance perspective, assuming:

1. **Environment:** Set `VITE_SITE_URL=https://phoenixeventsandproduction.com` (and Supabase vars) in the Vercel (or host) project.
2. **Supabase dashboard:** Under Authentication → URL Configuration, set **Site URL** to `https://phoenixeventsandproduction.com` and add **Redirect URLs** (e.g. `https://phoenixeventsandproduction.com/admin/set-password`).
3. **Asset:** `public/logo.png` exists so OG and favicon resolve.

---

## 5. Scores

| Metric | Score | Notes |
|--------|-------|--------|
| **SEO readiness** | **8/10** | Canonicals, OG, JSON-LD, sitemap, robots, single h1, non-empty alt on public images. Optional: dynamic sitemap for collaborations/events, more structured data. |
| **Deployment risk** | **Low** | Domain and SEO fixes applied; no exposed secrets; SPA fallback and 404 in place; hero video pauses when off-screen. |

---

## 6. What you should do before going live

1. **Review** all modified files (no push was performed).
2. Set **production env** on host: `VITE_SITE_URL=https://phoenixeventsandproduction.com`, plus Supabase URL and anon key.
3. In **Supabase** → Authentication → URL Configuration, set Site URL and Redirect URLs to the .com domain.
4. Confirm **public/logo.png** is present and correct.
5. After deploy, test: home, contact, gallery, events, one event detail, collaborations, one collaboration detail, 404, and admin login/set-password.

No deployment or git push was performed; changes are ready for your review and push.
