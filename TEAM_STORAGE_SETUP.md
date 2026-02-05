# Team Storage Setup (Employee Image & Documents)

Employee **photo** and **documents** use two Supabase Storage buckets. Create them and run the policies as below.

---

## 1. Create the buckets

In **Supabase Dashboard → Storage**:

### `team-photos` (private)

- **Name:** `team-photos`
- **Public:** **No** (admin-only; images are served via short‑lived signed URLs in the app)
- **Allowed MIME types:** optional; e.g. `image/jpeg, image/png, image/webp, image/gif`
- **File size limit:** optional; e.g. `2 MB`

### `team-documents` (private)

- **Name:** `team-documents`
- **Public:** **No** (download only via short‑lived signed URLs)
- **Allowed MIME types:** optional; e.g. `application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*`
- **File size limit:** optional; e.g. `10 MB`

---

## 2. Create buckets via SQL (alternative)

If you manage buckets via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('team-photos', 'team-photos', false, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('team-documents', 'team-documents', false, 10485760, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

Adjust `file_size_limit` (bytes) and `allowed_mime_types` as needed; `NULL` means no restriction.

---

## 3. Storage policies

Policies for `team-photos` and `team-documents` are in **`storage-policies.sql`**. Apply them **after** the buckets exist.

From that file, run the blocks:

- **TEAM-PHOTOS BUCKET POLICIES**  
  - Admin-only SELECT / INSERT / UPDATE / DELETE (using `admin_users`)

- **TEAM-DOCUMENTS BUCKET POLICIES**  
  - Admin-only SELECT / INSERT / UPDATE / DELETE

Example (Supabase SQL Editor or `psql`):

```bash
# If using Supabase CLI
supabase db execute -f storage-policies.sql
```

Or copy the `CREATE POLICY "..." ON storage.objects ...` statements for `team-photos` and `team-documents` into the SQL Editor and run them.

---

## 4. Database: `team_documents` table

Employee documents are stored in the `team_documents` table. Create it **after** `team` and `update_updated_at_column`:

```bash
# Run in order
# 1. supabase-schema.sql (or your main schema)
# 2. team-schema.sql
# 3. team-documents-schema.sql
```

The `team-documents-schema.sql` file defines:

- `team_documents` (id, team_id, name, file_path, file_type, created_at, updated_at)
- RLS: only admins
- `ON DELETE CASCADE` from `team`

---

## 5. Behaviour overview

| Item              | Bucket           | Public | Usage                                                                 |
|-------------------|------------------|--------|-----------------------------------------------------------------------|
| Employee photo    | `team-photos`    | No     | `photo_url` stores path `{team_id}/avatar.{ext}`; display via signed URL. |
| Employee documents| `team-documents` | No     | Rows in `team_documents` with `file_path`; download via signed URL.   |

- **Photo:** upload replaces any existing `team-photos/{team_id}/avatar.*`; `photo_url` stores the path; the app uses `getTeamPhotoUrl(path)` (signed URL, 1h) for display.
- **Documents:** upload stores in `team-documents/{team_id}/{uuid}-{filename}`; `file_path` is saved in `team_documents`; download uses `getTeamDocumentDownloadUrl(file_path)` (signed URL, 60s).

---

## 6. Checklist

- [ ] Create `team-photos` (Private)
- [ ] Create `team-documents` (Private)
- [ ] Run `team-documents-schema.sql` if not already applied
- [ ] Run the `storage.objects` policies for `team-photos` and `team-documents` from `storage-policies.sql`

---

## 7. Migration: make `team-photos` private (if it was created as Public)

If you already created `team-photos` as **Public** or applied the old “Public can view” policy, run this in the Supabase SQL Editor:

```sql
-- 1. Set the bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'team-photos';

-- 2. Remove the old public SELECT policy
DROP POLICY IF EXISTS "Public can view team photos" ON storage.objects;

-- 3. Add admin-only SELECT (if not already present)
CREATE POLICY "Admins can view team photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'team-photos' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

If `"Admins can view team photos"` already exists (e.g. from an updated `storage-policies.sql`), skip the `CREATE POLICY` or run `DROP POLICY IF EXISTS "Admins can view team photos" ON storage.objects;` first, then the `CREATE POLICY`.
