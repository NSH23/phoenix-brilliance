# Admin avatars – visibility and storage

Admin profile images are **only** shown in:

1. **Admin dashboard** – sidebar (current user) and any admin-only layout.
2. **Admin users section** – Settings → Add User → “Admin Users” list (each admin’s avatar).

They are **not** used on any public route or in public components.

## Keeping images private

To ensure avatars are only visible in the admin dashboard and admin users section:

1. **Make the bucket private**  
   In Supabase: **Storage** → **admin-avatars** → **Settings** → set the bucket to **Private**.  
   Then only signed URLs (generated when an admin is logged in) can access the files; direct public URLs will not work.

2. **Code**  
   The app only requests or resolves admin avatar URLs inside admin UI (e.g. `AdminUserAvatar`, Settings profile, sidebar). Signed URLs are created only in that context, so images are not exposed on public pages.

## Summary

| Where avatars appear | Location |
|----------------------|----------|
| Current user         | Admin sidebar (dashboard) |
| All admins           | Settings → Add User → Admin Users list |
| Profile edit         | Settings → Profile tab |

No public page or component uses admin avatar data.
