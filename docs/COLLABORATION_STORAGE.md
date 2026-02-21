# Collaboration & Admin Storage

## Buckets used (no new bucket needed)

- **gallery-images** (Public): Collaboration venue gallery images and videos (folder images). Admin uploads via Collaborations → Edit → Gallery use this bucket.
- **partner-logos** (Public): Collaboration logo and banner can use this for logos; banner can also be in gallery-images.
- **admin-avatars** (Public): Admin dashboard user avatars (sidebar, Settings).

## If collaboration or admin images don’t load

1. **Env**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Vercel (and locally) point to the same Supabase project where files are stored.
2. **Public read**: In Supabase Dashboard → Storage → each bucket → Policies, ensure there is a policy allowing **public SELECT** (e.g. “Public read”) so anonymous users can load images.
3. **Paths vs URLs**: The app resolves both:
   - Full URLs (e.g. from upload): used as-is.
   - Storage paths (e.g. `collab-id/123-image.jpg`): resolved using the bucket above and current `VITE_SUPABASE_URL`, so the correct project URL is used in production.

After changing env or policies, redeploy or hard-refresh the site.
