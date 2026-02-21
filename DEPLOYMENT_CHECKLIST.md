# Deployment checklist – Phoenix Brilliance

Use this before going live. Fix **Must-fix** items; **Should-fix** and **Nice-to-have** improve quality and maintainability.

---

## Must-fix before deploy

### 1. Environment variables (production)

- [ ] Set **production** env on your host (Vercel/Netlify/etc.):
  - `VITE_SUPABASE_URL` = your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` = **anon (public)** key from Supabase → Project Settings → API  
  Do **not** use `service_role` in the frontend.
- [ ] Ensure `.env` is **not** committed (it should be in `.gitignore`). Use host’s “Environment variables” for production.

### 2. Sitemap and robots.txt (production domain)

- [ ] **`public/sitemap.xml`**: Replace `https://yourdomain.com` with your real domain (e.g. `https://phoenixevents.com`) in every `<loc>`.
- [ ] **`public/robots.txt`**: Replace `https://yourdomain.com/sitemap.xml` in the `Sitemap:` line with your real domain.

Optional: add a build step or config (e.g. `VITE_SITE_URL`) to generate these from env so you don’t edit by hand per environment.

### 3. Supabase (production project)

- [ ] Run the **inquiries** migrations in the **production** Supabase project (SQL Editor), e.g.:
  - `20260220_inquiries_drop_and_create.sql` (if table doesn’t exist or you’re ok resetting)
  - `20260220_inquiries_anon_insert_only.sql` (so anon can INSERT; no SELECT for anon)
- [ ] Confirm **RLS** is enabled on `inquiries` and anon has **INSERT** only; admin access uses `admin_users` and auth.
- [ ] In Supabase → Authentication → URL Configuration, add your **production site URL** and **redirect URLs** (e.g. `https://yourdomain.com`, `https://yourdomain.com/admin`).

---

## Should-fix (recommended)

### 4. Console and logging

- [x] **PartnersSection** – `console.log("Fetched partners:")` removed.
- [ ] Prefer using `@/utils/logger` in app code so you can later send errors to Sentry/LogRocket (see `ErrorBoundary` and `logger.ts` TODOs).
- [ ] In production, ensure no sensitive data is logged. `console.error` in catch blocks is OK for debugging but consider toggling or replacing with error reporting.

### 5. SEO and meta (production URLs)

- [ ] **`index.html`** – `og:image` and favicon use `/logo.png`. Ensure `public/logo.png` exists and is the right asset. For OG, consider an absolute URL (e.g. `https://yourdomain.com/logo.png`) if social crawlers have issues.
- [ ] **SEO component** – Uses `window.location.origin` for canonical/OG URLs; fine for SPA. After deploy, test with [Facebook Debugger](https://developers.facebook.com/tools/debug/) / [Twitter Card Validator](https://cards-dev.twitter.com/validator).

### 6. 404 and error UX

- [ ] **NotFound** – Consider adding Navbar/Footer so users can navigate without using the back button. Optional: log 404s to your analytics.
- [ ] **ErrorBoundary** – Already shows a friendly message and “Go to Home” / “Refresh”. Optional: add Sentry (or similar) in the TODO in `ErrorBoundary` and `utils/logger`.

### 7. Admin and auth

- [ ] **ProtectedRoute** – Confirms auth and redirects to `/admin`; role check exists. Ensure production Supabase has `admin_users` populated and that only real admins are added.
- [ ] Test **admin login** on production (same Supabase project as production env vars) and that session persists and redirects work.

### 8. Forms and data

- [ ] **Lead capture / Contact** – Phone allows +91 and 10-digit; date inputs have min/max (1900–2099). Test submit once on production and confirm row in `inquiries` and no 401.
- [ ] **Inquiries RLS** – Anon can only INSERT; admins read/update/delete. Re-check after any new migration.

---

## Nice-to-have (post-launch)

### 9. Build and dependencies

- [ ] Run `npx update-browserslist-db@latest` to refresh caniuse data (build warned it’s 8 months old).
- [ ] Tailwind warnings about ambiguous classes (`duration-[400ms]`, etc.) – can be cleaned up for quieter builds; not blocking.

### 10. Performance

- [ ] Lazy routes are in place. Consider lazy-loading heavy below-the-fold sections if you add more.
- [ ] Hero/reels videos – already optimized (one playing at a time, thumbnails). Ensure production video URLs (Supabase Storage or CDN) are fast and use HTTPS.

### 11. Accessibility and UX

- [ ] Many components use `aria-*` or `role=`. Quick pass: ensure focus order and “Skip to content” if needed; fix any `alt=""` that should describe the image.
- [ ] Test keyboard nav and one screen reader (e.g. NVDA/VoiceOver) on main flows (home, contact, one gallery, admin login).

### 12. Monitoring and errors

- [ ] Add **Sentry** (or similar) and plug into `ErrorBoundary` and `logger` TODOs.
- [ ] Optional: add a simple health/version endpoint or a “last deploy” tag in admin footer for support.

### 13. Content and links

- [ ] Replace any placeholder copy (e.g. “Phoenix Events, 123 Event Street” on Contact if that’s not real).
- [ ] Check all **internal** links (e.g. `/gallery`, `/contact`) and **external** (WhatsApp, tel:, social). Ensure WhatsApp number in site config is the correct business number.

### 14. Duplicate / stray files (from git status)

- [ ] Clean up duplicate or unused files if present (e.g. `ContactForm.tsx` vs `Contact.tsx`, or `src\` vs `src/` duplicates). Prefer a single source of truth per feature so deployment and future edits are clear.

---

## Pre-deploy verification

- [ ] `npm run build` succeeds (already verified).
- [ ] `npm run preview` and click through: home, contact, gallery, one event, one collaboration, submit contact form (or lead modal), then admin login and one admin page.
- [ ] Production env vars set on host; build uses them (no hardcoded dev URLs).
- [ ] Sitemap and robots use production domain.
- [ ] Supabase production: migrations applied, RLS and anon INSERT working, auth URLs updated.

---

## Summary

| Area              | Status / action                                      |
|-------------------|------------------------------------------------------|
| Build             | ✅ Passes                                            |
| Env / secrets     | Set production Supabase URL + anon key on host       |
| Sitemap/robots    | Replace `yourdomain.com` with real domain            |
| Supabase prod     | Run migrations, RLS, auth URLs                       |
| Console logs      | Removed one; rest are errors (acceptable)           |
| Forms / RLS       | Phone +91 and date limits done; test once in prod   |
| 404 / errors      | OK; optional: Navbar on 404, Sentry later           |
| Admin             | Protected; test login and session in prod            |

After the must-fix items and a quick manual test, you’re ready to deploy.
