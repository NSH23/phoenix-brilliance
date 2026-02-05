# Supabase Email Configuration Guide

To enable email verification and password reset functionality, you need to configure Supabase email settings.

## Step 1: Configure Email Settings in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll down to **Email Auth** section

## Step 2: Enable Email Verification

1. **Enable email confirmations**: Toggle ON
2. **Secure email change**: Toggle ON (recommended)
3. **Double confirm email changes**: Toggle ON (recommended)

## Step 3: Configure Email Templates

### Signup Confirmation Email

1. Go to **Authentication** > **Email Templates**
2. Select **Confirm signup** template
3. Update the redirect URL to:
   ```
   {{ .SiteURL }}/admin/login
   ```
4. The email will contain a link that redirects users back to your login page after verification

### Email Change Confirmation

1. Select **Change email address** template
2. Update redirect URL similarly

## Step 4: Configure SMTP (Optional but Recommended)

For production, configure custom SMTP instead of using Supabase's default email service:

1. Go to **Project Settings** > **Auth**
2. Scroll to **SMTP Settings**
3. Configure your SMTP provider (SendGrid, Mailgun, AWS SES, etc.)

**SMTP Configuration Example:**
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Username**: `apikey`
- **Password**: Your SMTP API key
- **Sender email**: `noreply@yourdomain.com`
- **Sender name**: `Phoenix Events`

## Step 5: Test Email Verification

1. Sign up a new admin account
2. Check your email inbox (or spam folder)
3. Click the verification link
4. You should be redirected to `/admin/login` with a success message
5. Log in with your credentials

## Email Verification Flow

1. **User signs up** → Account created in `auth.users` and `admin_users` table
2. **Verification email sent** → User receives email with verification link
3. **User clicks link** → Redirected to `/admin/login` with verification token
4. **Token processed** → Account verified, user can now log in
5. **User logs in** → Full access to admin dashboard

## Troubleshooting

### Emails Not Sending

- Check **Authentication** > **Settings** > **Email Auth** is enabled
- Verify SMTP settings if using custom SMTP
- Check spam/junk folder
- Verify email address is correct

### Verification Link Not Working

- Ensure redirect URL in email template matches your app URL
- Check that the link hasn't expired (default: 1 hour)
- Verify Supabase project URL is correct

### User Can't Log In After Verification

- Check that user exists in `admin_users` table
- Verify user role is set correctly
- Check RLS policies allow the user to access admin_users table

## Disable Email Verification (Development Only)

⚠️ **Only for development/testing**

1. Go to **Authentication** > **Settings**
2. **Disable email confirmations**: Toggle OFF
3. Users can sign up and log in immediately without verification

**Note**: This should NEVER be enabled in production!

## Production Checklist

- [ ] Email confirmations enabled
- [ ] Custom SMTP configured
- [ ] Email templates customized with your branding
- [ ] Redirect URLs set correctly
- [ ] Test signup and verification flow
- [ ] Test password reset flow
- [ ] Monitor email delivery rates
