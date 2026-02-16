# Storage Setup Instructions

To support the new "Manage Videos" feature and other dynamic content, you need to set up a new storage bucket in Supabase.

1.  **Login to Supabase Dashboard**.
2.  Go to **Storage** from the left sidebar.
3.  Click **New Bucket**.
4.  Enter the name: `content-media`.
5.  **Toggle "Public bucket" to ON**.
6.  Click **Save**.
7.  After creating the bucket, **run the SQL migration** `supabase/migrations/20240215_create_content_media.sql` in the **SQL Editor** to create the table and apply the storage policies.

## Existing Buckets Reminder
Ensure these buckets also exist and are public:
- `event-images`
- `album-images`
- `partner-logos`
- `gallery-images`
- `before-after-images`
- `testimonial-avatars`

And these should be private (if used):
- `admin-avatars`
- `team-photos`
- `team-documents`
