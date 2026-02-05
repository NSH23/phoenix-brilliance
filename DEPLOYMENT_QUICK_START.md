# Quick Deployment Guide

## 🚀 Fastest Way to Deploy (5 Minutes)

### Step 1: Prepare Your Code

```bash
# Make sure everything is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
7. Click "Deploy"
8. Wait 2-3 minutes
9. ✅ Done! You have a live URL

### Step 3: Add Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your domain
3. Follow DNS instructions
4. Wait 24-48 hours for DNS propagation

---

## 🔄 Updating Your Website

### Method 1: Automatic (Recommended)

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update content"
   git push origin main
   ```
3. Vercel automatically deploys
4. ✅ Done! (No downtime)

### Method 2: Manual

1. Make changes
2. Build locally:
   ```bash
   npm run build
   ```
3. Test preview:
   ```bash
   npm run preview
   ```
4. If everything works, push to GitHub
5. Vercel deploys automatically

---

## 🛠️ Maintenance Mode

### Option 1: Deploy Maintenance Page

Create `public/maintenance.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Site Maintenance</title>
  <style>
    body { text-align: center; padding: 50px; font-family: Arial; }
  </style>
</head>
<body>
  <h1>We'll be back soon!</h1>
  <p>We're performing scheduled maintenance.</p>
</body>
</html>
```

Update `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/maintenance.html"
    }
  ]
}
```

Deploy, then revert when done.

### Option 2: Feature Flag

Use environment variable:
```typescript
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

if (MAINTENANCE_MODE) {
  return <MaintenancePage />;
}
```

Toggle in Vercel environment variables.

---

## 📱 Testing Checklist

Before going live, test:

- [ ] Homepage loads
- [ ] All navigation links work
- [ ] Contact form submits
- [ ] Admin dashboard login works
- [ ] Mobile view (phone)
- [ ] Tablet view
- [ ] Desktop view
- [ ] Images load
- [ ] No console errors

---

## 🆘 Quick Troubleshooting

**Build fails?**
- Check build logs in Vercel
- Verify environment variables
- Check for TypeScript errors

**Site not loading?**
- Check deployment status
- Verify domain DNS settings
- Check SSL certificate

**API errors?**
- Verify Supabase URL and keys
- Check RLS policies
- Check network tab in browser

---

## 📞 Need Help?

1. Check full guide: `DEPLOYMENT_GUIDE.md`
2. Check platform docs:
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
3. Check error logs in deployment platform

---

**That's it! Your website is live! 🎉**
