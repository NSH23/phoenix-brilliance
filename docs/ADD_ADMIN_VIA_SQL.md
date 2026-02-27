# Add Admin User via SQL

Add admin users directly in the database. They can log in with their email and default password, then **must change their password** on first login.

## 1. Run the migration

Apply the migration (if not already applied):

```bash
supabase db push
```

Or run the migration file manually in **Supabase Dashboard → SQL Editor**:
`supabase/migrations/20260227_add_admin_user_via_sql.sql`

## 2. Add an admin user

In **Supabase Dashboard → SQL Editor**, run:

```sql
SELECT add_admin_user_via_sql('demovishal07@gmail.com', 'Demo Vishal', 'admin@123');
```

**Parameters:**
- `email` – Admin email (used for login)
- `name` – Display name (optional; defaults to email prefix)
- `password` – Default password (optional; defaults to `admin@123`)

**Example for another user:**
```sql
SELECT add_admin_user_via_sql('newadmin@example.com', 'New Admin', 'admin@123');
```

## 3. Login flow

1. User goes to `/admin` and signs in with **email** and **default password**.
2. On first login, they are redirected to **Set Password**.
3. They set a new password; the default password no longer works.
4. They are redirected to the admin dashboard.

## Notes

- The function creates the user in `auth.users`, `auth.identities`, and `admin_users`.
- If the email already exists, the function raises an error.
- `must_change_password` is set to `true` so the app forces a password change on first login.
