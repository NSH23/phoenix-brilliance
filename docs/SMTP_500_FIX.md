# Fix 500 Error – OTP / Password Reset Emails Not Sending

When you see **"Failed to load resource: 500"** or **"Email could not be sent (server error)"** on **Send OTP**, **Forgot password**, or **Resend verification**, Supabase is failing to send the email. Fix it in the Supabase Dashboard (no code changes).

---

## Step 1: Open SMTP settings

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)** → select your project.
2. Click **Project Settings** (gear icon in the sidebar).
3. Open **Auth** in the left menu.
4. Scroll to **SMTP**.

---

## Step 2: Configure custom SMTP

**Enable Custom SMTP** must be **ON**. Then set:

| Field | What to use |
|--------|----------------|
| **Sender email** | An address your provider allows to send from (e.g. `noreply@phoenixeventsandproduction.com` or your Gmail). |
| **Sender name** | e.g. `Phoenix Admin` |
| **Host** | Your provider’s SMTP host (see below). |
| **Port** | **587** (TLS) or **465** (SSL). Prefer 587. |
| **Username** | Usually your full email or the username the provider gives for SMTP. |
| **Password** | **Not** your normal email password. Use an **App Password** or **SMTP/API key** from the provider. |

### Option A – Gmail

- **Host:** `smtp.gmail.com`  
- **Port:** `587`  
- **Username:** your full Gmail (e.g. `Phoenixeventsandproduction@gmail.com`)  
- **Password:** [App Password](https://myaccount.google.com/apppasswords) (turn on 2FA first, then create App Password).  
- **Sender email:** same Gmail as Username.

### Option B – Brevo (Sendinblue)

- **Host:** `smtp-relay.brevo.com`  
- **Port:** `587`  
- **Username:** your **Brevo login email** (the email you use to log in at app.brevo.com). **Not** a Gmail or other address.  
- **Password:** **SMTP key** from Brevo → **SMTP & API** → **SMTP** (not your Brevo account password, not Gmail).  
- **Sender email:** a **verified sender** in Brevo (Senders & IP → Senders). If you use `noreply@phoenixeventsandproduction.com`, that exact address must be verified in Brevo.

### Option C – SendGrid / Mailgun / other

Use the **SMTP** credentials from the provider’s dashboard. **Sender email** is often required to be a **verified** sender or domain.

---

## Step 3: Redirect URLs (so the link in the email works)

1. In Supabase: **Authentication** → **URL Configuration**.
2. **Site URL:** `https://phoenixeventsandproduction.com`
3. **Redirect URLs** – add exactly:
   - `https://phoenixeventsandproduction.com/admin/set-password`
   - `https://phoenixeventsandproduction.com/admin`  
   (and keep `http://localhost:5173/admin/set-password` if you test locally).

---

## Step 4: Save and test

1. Click **Save** in the SMTP section.
2. In your app: **Admin → Settings** → Add new admin → enter email → **Send OTP**.
3. Check the inbox (and spam). The OTP should arrive and the 500 should stop.

---

## Step 5: If it still returns 500

1. **Auth logs**  
   Supabase → **Authentication** → **Logs** (or **Logs** in the sidebar). Trigger “Send OTP” again and look for the error (e.g. “Authentication failed”, “Connection refused”). That message tells you what’s wrong (wrong password, wrong port, etc.).

2. **Test without custom SMTP**  
   Turn **off** “Enable Custom SMTP” and try again.  
   - If it **works**: the problem is your SMTP settings; fix them and turn custom SMTP back on.  
   - If it **still 500**: possible Supabase/rate limit issue; check status or try again later.

3. **Typical mistakes**
   - **Gmail:** Using normal password instead of App Password; 2FA not enabled.
   - **Brevo:** Using account password instead of **SMTP key**; sender not verified.
   - **Wrong port:** Try **587** with TLS, or **465** with SSL.
   - **Sender email:** Must be allowed by the provider (verified sender/domain).

---

## Step 6: Show OTP in the email body (optional)

So users can type the 6-digit code instead of only clicking the link:

1. **Authentication** → **Email Templates** → **Magic Link**.
2. In the body, add: `{{ .Token }}` (this is the 6-digit OTP).
3. Example body:

```html
<h2>Your one-time login code</h2>
<p>Use this 6-digit code in the admin dashboard:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>Or click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in with link</a></p>
```

4. Save. New OTP emails will show the code and the link.

---

## Summary

| Goal | Where |
|------|--------|
| Fix 500 so emails send | **Project Settings** → **Auth** → **SMTP** (correct host, port, username, App Password/API key, sender email). |
| Link in email works | **Authentication** → **URL Configuration** → **Redirect URLs** includes `https://phoenixeventsandproduction.com/admin/set-password`. |
| See real error | **Authentication** → **Logs** after triggering Send OTP. |
| Show OTP in email | **Authentication** → **Email Templates** → **Magic Link** → add `{{ .Token }}`. |

Once SMTP is correct and redirect URLs are set, the OTP will go to the submitted email and the 500 will stop.
