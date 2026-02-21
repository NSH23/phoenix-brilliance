# Fix: OTP Not Showing in Admin Invite Email

When you add a new admin (email + name) and click "Send OTP", Supabase sends an email but **the 6-digit code does not appear** in the email body. By default, the template only includes a "magic link" and not the OTP.

## Fix in 4 steps

### 1. Open Supabase Dashboard

- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project (e.g. **phoenix-brilliance**)

### 2. Go to Email Templates

- In the left sidebar: **Authentication** → **Email Templates**
- Or open: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/templates`

### 3. Edit the "Magic Link" template

- Find the template named **Magic Link** (this is the one used for `signInWithOtp`).
- Click to expand / edit it.

**Subject** (optional; you can keep the default):

- e.g. `Your login code for Phoenix Admin`

**Message body** – you **must** add the OTP so the code is visible in the email.

Use **both** the link and the code so users can either click or type the code:

```html
<h2>Your one-time login code</h2>

<p>Use this 6-digit code in the admin dashboard:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>

<p>Or click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in with link</a></p>

<p>This code expires in 1 hour. If you didn't request this, you can ignore this email.</p>
```

Important: the variable **`{{ .Token }}`** is what Supabase replaces with the 6-digit OTP. If this is missing from the template, the email will not contain the code.

### 4. Save

- Click **Save** at the bottom of the Magic Link template.
- Try "Send OTP" again from Admin → Settings → Add new admin; the email should now show the 6-digit code.

---

## Optional: Redirect URL for “Set password” page

So that new admins can set their password when they click the link in the email:

- **Authentication** → **URL Configuration**
- **Site URL**: your app URL (e.g. `https://yourdomain.com` or `http://localhost:5173` for dev)
- **Redirect URLs**: add:
  - `https://yourdomain.com/admin/set-password` (and `http://localhost:5173/admin/set-password` for dev)

Then in the Magic Link template you can set the link to send users to your set-password page, e.g.:

`{{ .SiteURL }}/admin/set-password?token_hash={{ .TokenHash }}&type=email`

Or use the default **ConfirmationURL**; Supabase will verify and redirect to your **Redirect URL** with the session in the fragment; the app’s `/admin/set-password` page will then let them set a password.

---

## Summary

| What | Where |
|------|--------|
| Template to edit | **Authentication** → **Email Templates** → **Magic Link** |
| Variable for 6-digit OTP | `{{ .Token }}` |
| Variable for clickable link | `{{ .ConfirmationURL }}` |

After adding `{{ .Token }}` to the Magic Link template body and saving, the OTP will appear in the email when you add a new admin and send the OTP.

---

## If you get 403 Forbidden or "Token expired" when entering the OTP

- **Redirect URLs**: In **Authentication** → **URL Configuration** → **Redirect URLs**, add your exact app URLs (e.g. `http://localhost:5173/admin/set-password` and your production URL). Without these, verify can fail with 403.
- **Expiry**: OTPs usually expire after about 1 hour. Request a new code and enter it within a few minutes.
- The app tries both `email` and `magiclink` verification types; if it still fails, check Supabase Auth logs in the dashboard for the exact error.
