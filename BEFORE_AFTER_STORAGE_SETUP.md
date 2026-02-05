# Before & After Storage Bucket Setup

The `before-after-images` bucket is used for Before/After comparison images on the homepage.

## 1. Create the bucket in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. **Name:** `before-after-images`
4. **Public bucket:** Enable (so images display on the homepage)
5. **Allowed MIME types:** Leave **empty** to allow all image types (PNG, JPEG, WebP, etc.)
   - If your project requires restrictions, use: `image/png, image/jpeg, image/webp, image/gif`
6. Click **Create bucket**

## 2. Apply storage policies

Run the following SQL in **Supabase** → **SQL Editor**:

```sql
-- BEFORE-AFTER-IMAGES BUCKET POLICIES
CREATE POLICY "Public can view before-after images"
ON storage.objects FOR SELECT
USING (bucket_id = 'before-after-images');

CREATE POLICY "Admins can upload before-after images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'before-after-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update before-after images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'before-after-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can delete before-after images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'before-after-images' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

## 3. Fixing existing buckets with MIME restrictions

If `gallery-images` or other buckets reject PNG with "mime type image/png is not supported":

1. Go to **Storage** → select the bucket
2. Open **Settings** (gear icon)
3. Under **Allowed MIME types**, either:
   - Clear the list to allow all types, or
   - Add `image/png, image/jpeg, image/webp, image/gif`

Note: Some Supabase projects may require the bucket to be recreated if MIME settings cannot be changed.
