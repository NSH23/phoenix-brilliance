# ============================================================
# Phoenix Events — Cloudinary Migration Guide
# ============================================================

## STEP 1: Add to your .env.local file
```
VITE_CLOUDINARY_CLOUD_NAME=dutkr9zku
VITE_CLOUDINARY_UPLOAD_PRESET=Phoenix Events and Production
```

Keep your existing Supabase vars as they are:
```
VITE_SUPABASE_URL=https://sainjerowmjetpmtezwg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## STEP 2: Add to Vercel Environment Variables
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these two:
| Key                            | Value                          |
|--------------------------------|--------------------------------|
| VITE_CLOUDINARY_CLOUD_NAME     | dutkr9zku                      |
| VITE_CLOUDINARY_UPLOAD_PRESET  | Phoenix Events and Production  |

---

## STEP 3: Copy new files into your project

Copy these files into your project (replace existing ones):
- cloudinary.ts  →  src/lib/cloudinary.ts  (NEW FILE)
- storage.ts     →  src/lib/storage.ts     (REPLACE existing)
- ImageUpload.tsx →  src/components/ImageUpload.tsx (REPLACE existing)

---

## STEP 4: Update all upload calls in your admin pages

Anywhere you currently call uploadFile() or similar Supabase storage functions,
replace with uploadToCloudinary():

### Before (Supabase):
```typescript
import { uploadFile } from '@/lib/storage';
const url = await uploadFile('event-images', `${Date.now()}.jpg`, file);
```

### After (Cloudinary):
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary';
const url = await uploadToCloudinary(file, 'event-images');
```

The returned URL is a full Cloudinary CDN URL like:
https://res.cloudinary.com/dutkr9zku/image/upload/phoenix/event-images/filename.jpg

Store this URL directly in your Supabase DB column — no changes needed to DB schema.

---

## STEP 5: Video uploads (content-media bucket)

For videos, the same function works:
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary';

// Accepts mp4, webm, mov automatically
const url = await uploadToCloudinary(videoFile, 'content-media', (percent) => {
  console.log(`Upload progress: ${percent}%`);
});
```

---

## STEP 6: Migrate existing images (optional but recommended)

Your existing images in Supabase Storage still work — they'll display fine.
But to fully get off Supabase storage, you can:

1. Download all files from each Supabase bucket
2. Upload them to Cloudinary via the Cloudinary dashboard (bulk upload)
3. Update the URLs in your Supabase DB rows

OR just leave old images on Supabase (they won't cause egress issues
since they're rarely accessed) and all NEW uploads go to Cloudinary.

---

## What stays the same ✅
- Supabase DB (all tables, rows, policies)
- Supabase Auth (login, sessions)
- All your admin UI / components
- All your frontend pages

## What changes ✅
- New file uploads → go to Cloudinary CDN (zero egress issues)
- Old file URLs in DB → still work as-is
- Monthly bandwidth → 25GB free (vs 5GB on Supabase)

---

## Folder structure in Cloudinary
Your files will be organized as:
phoenix/
├── event-images/
├── album-images/
├── partner-logos/
├── gallery-images/
├── before-after-images/
├── testimonial-avatars/
├── admin-avatars/
├── team-photos/
├── team-documents/
├── service-images/
├── site-logo/
└── content-media/     ← videos go here too
