# Supabase Setup Guide for Phoenix Events

This guide will walk you through setting up Supabase for your Phoenix Events website.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created
3. Your project's API keys and URL

## Step 1: Run the Database Schema

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`
6. Wait for all queries to complete successfully

## Step 2: Create Storage Buckets

1. Go to **Storage** in your Supabase Dashboard
2. Click **New Bucket** and create the following buckets:

   - **event-images** (Public: Yes)
   - **album-images** (Public: Yes)
   - **partner-logos** (Public: Yes)
   - **gallery-images** (Public: Yes)
   - **testimonial-avatars** (Public: Yes)
   - **admin-avatars** (Public: No - private)

3. For each bucket, set the following:
   - **Public bucket**: Toggle ON for public buckets (event-images, album-images, partner-logos, gallery-images, testimonial-avatars)
   - **File size limit**: 10 MB (or as needed)
   - **Allowed MIME types**: `image/*` (or specific types like `image/jpeg,image/png,image/webp`)

## Step 3: Set Up Storage Policies

1. Go to **Storage** > **Policies**
2. For each bucket, create the following policies:

### For Public Buckets (event-images, album-images, partner-logos, gallery-images, testimonial-avatars):

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'BUCKET_NAME');
```

**Policy 2: Admin Upload**
```sql
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'BUCKET_NAME' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

**Policy 3: Admin Update**
```sql
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'BUCKET_NAME' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

**Policy 4: Admin Delete**
```sql
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'BUCKET_NAME' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

### For Private Buckets (admin-avatars):

**Policy 1: Admin Read**
```sql
CREATE POLICY "Admins can view admin avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'admin-avatars' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

**Policy 2-4: Same as above for upload, update, delete**

Replace `BUCKET_NAME` with the actual bucket name for each policy.

## Step 4: Create Your First Admin User

### Option A: Using Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click **Add User** > **Create New User**
3. Enter email and password
4. Copy the **User UUID** from the user list
5. Go to **SQL Editor** and run:

```sql
INSERT INTO admin_users (id, email, name, role)
VALUES ('<USER_UUID>', 'admin@phoenix.com', 'Admin User', 'admin');
```

### Option B: Using SQL (if user already exists)

1. Find the user UUID from `auth.users` table
2. Run:

```sql
INSERT INTO admin_users (id, email, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@phoenix.com'),
  'admin@phoenix.com',
  'Admin User',
  'admin'
);
```

## Step 5: Get Your Supabase Credentials

1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for client-side)
   - **service_role key** (for server-side - keep secret!)

## Step 6: Install Supabase Client

In your project root, run:

```bash
npm install @supabase/supabase-js
```

## Step 7: Create Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Never commit your `.env` file with real keys. Add `.env` to `.gitignore`.

## Step 8: Create Supabase Client Utility

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Step 9: Update AdminContext for Supabase Auth

You'll need to update `src/contexts/AdminContext.tsx` to use Supabase authentication instead of mock authentication.

## Step 10: Test the Connection

1. Start your development server
2. Try logging in with your admin credentials
3. Check the browser console for any errors
4. Verify data is loading from Supabase

## Troubleshooting

### RLS Policies Not Working

- Make sure RLS is enabled on all tables
- Check that your policies are correctly written
- Verify the admin_users table has your user ID

### Storage Upload Failing

- Check bucket policies are set correctly
- Verify bucket is public (if needed)
- Check file size limits
- Ensure MIME types are allowed

### Authentication Issues

- Verify your Supabase URL and keys are correct
- Check that the user exists in `auth.users`
- Ensure the user is added to `admin_users` table
- Check browser console for specific error messages

## Database Schema Overview

### Core Tables
- **events**: Event types (Wedding, Birthday, etc.)
- **event_steps**: Process steps for each event type
- **event_albums**: Albums for specific events
- **album_media**: Images/videos in albums
- **gallery**: General gallery images
- **collaborations**: Partner venues/collaborators
- **collaboration_images**: Images for collaborations
- **collaboration_steps**: Booking steps for collaborations

### Content Tables
- **services**: Service offerings
- **testimonials**: Client testimonials
- **inquiries**: Contact form submissions
- **site_content**: Editable page content
- **site_settings**: Site configuration
- **social_links**: Social media links
- **contact_info**: Contact information

### Admin Tables
- **admin_users**: Admin user management
- **admin_push_subscriptions**: Web Push subscriptions for admin devices (migration `20260425_admin_push_subscriptions.sql`)

## Admin Web Push (closed-app inquiry alerts)

This sends a **device notification** when a new row is inserted into `public.inquiries`, even if the admin PWA is fully closed. It does **not** run on every page load: work happens only on **subscribe once per device** and **one Edge Function invocation per new inquiry**.

### 1) Apply the migration

Run `supabase/migrations/20260425_admin_push_subscriptions.sql` in the SQL Editor (or via your migration pipeline).

### 2) VAPID keys

On your machine:

```bash
npx web-push generate-vapid-keys
```

- Put **Public Key** in your frontend env as `VITE_VAPID_PUBLIC_KEY` (Vercel/Netlify/hosting dashboard), then redeploy the site.
- Put **Public + Private + subject** into Supabase Edge secrets (next step). Never commit the private key.

`VAPID_SUBJECT` is usually `mailto:you@yourdomain.com`.

### 3) Deploy the Edge Function

Function path: `supabase/functions/send-inquiry-push/`

Set secrets in Supabase (**Edge Functions → Secrets**):

- `WEBHOOK_SECRET` — long random string (you choose)
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Deploy:

```bash
supabase functions deploy send-inquiry-push --no-verify-jwt
```

(`--no-verify-jwt` because the Database Webhook will not send a user JWT; we authenticate using `x-phoenix-webhook-secret` instead.)

### 4) Database Webhook

In Supabase: **Database → Webhooks → Create**:

- **Table**: `public.inquiries`
- **Events**: Insert
- **HTTP Request**: POST to  
  `https://<PROJECT_REF>.supabase.co/functions/v1/send-inquiry-push`
- **HTTP Headers**: add  
  `x-phoenix-webhook-secret: <same value as WEBHOOK_SECRET>`

### 5) Enable on a phone

Open the admin dashboard → bell → **Enable mobile alerts** (browser permission). The device subscription is stored in `admin_push_subscriptions`.

## Next Steps

After setup:
1. Update your frontend components to fetch data from Supabase
2. Implement image upload functionality
3. Connect admin forms to Supabase
4. Set up real-time subscriptions if needed
5. Configure email notifications for inquiries

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Review RLS policies
3. Verify environment variables
4. Check browser console for errors
