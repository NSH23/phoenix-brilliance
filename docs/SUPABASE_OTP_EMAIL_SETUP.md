# Fix: OTP Not Showing in Admin Invite Email

When you add a new admin (email + name) and click "Send OTP", Supabase sends an email but **the 6-digit code does not appear** in the email body. By default, the template only includes a "magic link" and not the OTP.

**Production site URL:** `https://phoenixeventsandproduction.com` — use this for Supabase **Site URL** and **Redirect URLs** in production (no localhost or vercel.app).

## 500 error when sending magic link / OTP email

If you see **"Failed to load resource: 500"** or **"Email could not be sent (server error)"** when clicking "Send OTP", Supabase is failing to send the email. With **custom SMTP** enabled, this usually means the SMTP configuration is wrong or the provider is rejecting the request.

### 1. Check SMTP settings in Supabase

- **Dashboard** → **Project Settings** (gear) → **Auth** → **SMTP**
- Ensure **Enable Custom SMTP** is ON and every field is correct:

| Setting        | What to check |
|----------------|----------------|
| **Sender email** | Must be a valid address your SMTP provider allows (e.g. `noreply@yourdomain.com`, or your full Gmail). |
| **Sender name**  | Any readable name (e.g. "Phoenix Admin"). |
| **Host**         | Exact SMTP host (e.g. `smtp.gmail.com`, `smtp.sendgrid.net`). |
| **Port**         | Usually **587** (TLS) or **465** (SSL). Avoid **25** if possible. |
| **Username**     | Full email or API username from the provider. |
| **Password**     | App password or API key. For Gmail use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password. |

### 2. Common SMTP fixes

- **Gmail**: Use **Port 587**, enable **TLS**. Turn on 2FA and create an **App Password**; use that as the SMTP password. Sender email = the Gmail that owns the App Password.
- **Brevo (formerly Sendinblue)** – use these in Supabase SMTP:
  - **Host:** `smtp-relay.brevo.com`
  - **Port:** `587`
  - **Username:** your Brevo login email (for app.brevo.com)
  - **Password:** your Brevo **SMTP key** (Brevo → SMTP & API → SMTP → create or copy the SMTP key). Do **not** use your Brevo account password.
  - **Sender email:** must be a **verified sender** in Brevo (Senders & IP → Senders). Use that exact address.
  - **Enable TLS:** ON
- **SendGrid / Mailgun / etc.**: Use the **SMTP** credentials from the provider's dashboard. Sender email often must be a **verified** sender/domain.
- **Wrong port or TLS**: Try **587** with TLS, or **465** with SSL.
- **"Authentication failed" / "Connection refused"**: Double-check username/password and that host/port match the provider's docs.

**500 even with SMTP turned OFF:** Some projects still get 500 when custom SMTP is disabled (Supabase default mail can fail or be restricted). Re-enable custom SMTP and fix the provider settings (e.g. Brevo above); once credentials are correct, the 500 should stop.

**If you see `535 5.7.8 Authentication failed` in logs:**  
The SMTP server rejected the username or password. For **Gmail**: (1) Enable 2FA, (2) Create an [App Password](https://myaccount.google.com/apppasswords), (3) In Supabase use full Gmail as Username and the App Password. For **Brevo**: use your Brevo login email as Username and the **SMTP key** (from Brevo → SMTP & API → SMTP) as Password—not your account password.

### 3. Redirect URLs

- **Authentication** → **URL Configuration** → **Redirect URLs**: add e.g. `https://yourdomain.com/admin/set-password` and `http://localhost:5173/admin/set-password`. (This avoids 403; it doesn't fix 500 but is required for the link to work.)

### 4. Check Supabase Auth logs

- **Authentication** → **Logs** (or **Logs** in the sidebar). Look for errors when you click "Send OTP". You may see the real SMTP error (e.g. "Authentication failed", "Connection timed out").

### 5. Test without custom SMTP

- Temporarily **disable** custom SMTP so Supabase sends the email with its default. Try "Send OTP" again. If it works, the problem is your SMTP config; if it still 500s, the issue may be Supabase or rate limits.

---

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
