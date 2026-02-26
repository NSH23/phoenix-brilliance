# Storage Buckets & Logo – What You Need

## 1. Services section – do you need a storage bucket?

**Yes.** The Services section (homepage “What We Create” cards) already uses a Supabase Storage bucket:

- **Bucket name:** `service-images`
- **Purpose:** Store one image per service. In Admin → Services you upload an image (or paste a full URL). The app stores either a full URL or a file path; paths are resolved via `service-images`.
- **If the bucket is missing:** You get “Bucket not found” or broken images. The code falls back to a placeholder image, but to use your own images you need the bucket.

### Create the service-images bucket

**Option A – Run migrations (recommended)**

```bash
npx supabase db push
```

Or run manually in Supabase Dashboard → SQL Editor the migration:

- `supabase/migrations/20260221_service_images_bucket.sql`

**Option B – Create in Dashboard**

1. Storage → **New bucket**
2. Name: `service-images`
3. Public: **Yes**
4. File size limit: 5 MB
5. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
6. Add policies: public read; authenticated upload/update/delete (see the migration file or `docs/SERVICE_IMAGES_BUCKET.md`).

After the bucket exists, go to **Admin → Services**, edit each service, and upload an image or set a full image URL. The homepage will show those images in the expanding cards.

---

## 2. Logo – storage bucket and using it everywhere

To store the website logo in Supabase and use it consistently across the site:

### Create the logo bucket

A migration is provided: **`supabase/migrations/YYYYMMDD_site_logo_bucket.sql`**. It:

- Creates a **public** bucket `site-logo` (e.g. 2 MB limit, image MIME types).
- Adds policies: public read; authenticated (admin) upload/update/delete.

Run your migrations (`npx supabase db push`) or run that migration in the SQL Editor.

### Where the logo is used

Once the app supports a “logo from config”, the same URL is used in:

- **Navbar** (desktop and mobile)
- **Footer** (brand block)
- **Admin sidebar** and **Login** page
- **SEO / Open Graph** (meta tags, `SEO` component)
- **Structured data** (JSON-LD `Organization` / `EventPlanningBusiness`)

The app reads the logo URL from **site_settings** (key `site_logo_url`). If set, it can be a full URL (e.g. from `site-logo` bucket); if empty, the app falls back to `/logo.png`.

### Setting the logo (after implementation)

1. Run the migration so the **`site-logo`** bucket and **`site_settings.site_logo_url`** key exist (see migration `20260224_site_logo_bucket.sql`).
2. In **Admin → Settings → Site**, use the **Site Logo** card: upload an image (it goes to the `site-logo` bucket) or paste a full URL. Save to store the logo URL in `site_settings.site_logo_url`.
3. All pages and components (navbar, footer, admin sidebar, login, SEO, structured data) will use this URL. If empty, the app falls back to `/logo.png`.

---

## 3. Database improvements for a more robust site

Suggested schema/config improvements:

| Improvement | Purpose |
|-------------|--------|
| **`service-images` bucket** | Already in code; ensure migration is applied so Services section can use uploaded images. |
| **`site-logo` bucket** | Store site logo; one place to update logo, used everywhere (navbar, footer, admin, SEO, structured data). |
| **`site_settings.site_logo_url`** | Store logo URL (or path). Public read so frontend can show it; admin-only write. |
| **`contact_info`** | Already exists. Use real address/phone; avoid placeholder seed (“123 Event Street”) in production—see `SiteConfigContext` which treats that as placeholder and shows your real address. |
| **Optional: `site_settings` keys** | e.g. `favicon_url`, `og_default_image` so default favicon and default social image can be changed from admin without redeploy. |

### Optional future improvements

- **Favicon:** Store in `site-logo` (or a `brand-assets` bucket) and add `site_settings.favicon_url` so the favicon is editable from admin.
- **Default OG image:** `site_settings.og_default_image` for pages that don’t have a specific image.
- **Services table:** Already has `image_url`; ensure Admin → Services uses the `service-images` bucket when uploading (already implemented).

No change to core tables (events, testimonials, contact_info, etc.) is required for “robust and nice” beyond:

1. Applying the **service-images** and **site-logo** bucket migrations.
2. Adding **site_logo_url** to site_settings and reading it in the app so the logo is consistent everywhere.

---

## Summary

- **Services section:** You need the **`service-images`** bucket. Create it via the existing migration or Dashboard; then upload service images in Admin → Services.
- **Logo:** Create the **`site-logo`** bucket and store the logo URL in **`site_settings.site_logo_url`**. The app can then use one logo URL everywhere (navbar, footer, admin, SEO, structured data) with fallback to `/logo.png`.
- **Database:** Ensure both buckets exist and policies are applied; add `site_logo_url` (and optionally favicon/og image keys) for a more maintainable, robust setup.
