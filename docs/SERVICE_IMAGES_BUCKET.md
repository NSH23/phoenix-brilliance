# Service images storage bucket (homepage “Our Services” section)

The homepage **Services** section shows one image per service. Images can be:

- **Full URLs** (e.g. `https://...`) – used as-is.
- **Storage paths** – resolved via the **`service-images`** Supabase Storage bucket.

If service images are not visible, the **`service-images`** bucket may be missing or the migration not applied.

## Create the bucket

### Option 1: Run the migration (recommended)

From the project root:

```bash
npx supabase db push
```

Or run the migration SQL manually in the Supabase Dashboard → SQL Editor:

- File: `supabase/migrations/20260221_service_images_bucket.sql`

That migration:

- Creates the **`service-images`** bucket (public, 5MB limit, images only).
- Adds policies so the public can read and authenticated users (admin) can upload/update/delete.

### Option 2: Create the bucket in the Dashboard

1. Supabase Dashboard → **Storage** → **New bucket**.
2. **Name:** `service-images`.
3. **Public bucket:** Yes (so the homepage can show images without auth).
4. **File size limit:** 5 MB (or as you prefer).
5. **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
6. Create the bucket, then go to **Policies** and add:
   - **Public read:** `SELECT` for everyone on `bucket_id = 'service-images'`.
   - **Upload/update/delete:** for `authenticated` (or your admin role) on `bucket_id = 'service-images'`.

## After the bucket exists

- In **Admin → Services**, edit each service and upload an image (or paste a full image URL).
- The app stores either a full URL or the file path in `services.image_url`.
- The homepage uses `getPublicUrl("service-images", image_url)` when `image_url` is not a full URL.

If an image still doesn’t load (e.g. file deleted or wrong path), the UI falls back to a placeholder image.
