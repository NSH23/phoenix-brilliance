# Supabase Setup Summary - Phoenix Events

## 📋 Overview

This document provides a quick summary of the Supabase setup for Phoenix Events website. All SQL files and setup instructions are ready for you to run.

## 📁 Files Created

1. **`supabase-schema.sql`** - Complete database schema with all tables, indexes, RLS policies, and triggers
2. **`storage-policies.sql`** - Storage bucket policies for image uploads
3. **`common-queries.sql`** - Useful queries for common operations
4. **`SUPABASE_SETUP.md`** - Detailed setup instructions
5. **`SUPABASE_SUMMARY.md`** - This file

## 🗄️ Database Schema

### Core Tables (16 tables total)

#### Events & Albums
- `events` - Event types (Wedding, Birthday, Corporate, etc.)
- `event_steps` - Process/roadmap steps for each event type
- `event_albums` - Albums for specific events
- `album_media` - Images and videos in albums

#### Gallery & Media
- `gallery` - General gallery images (homepage gallery section)

#### Collaborations
- `collaborations` - Partner venues and collaborators
- `collaboration_images` - Images for collaboration venues
- `collaboration_steps` - Booking steps for collaborations

#### Content Management
- `services` - Service offerings
- `testimonials` - Client testimonials
- `inquiries` - Contact form submissions
- `site_content` - Editable page content (hero, sections, etc.)
- `site_settings` - Site configuration
- `social_links` - Social media links
- `contact_info` - Contact information

#### Admin
- `admin_users` - Admin user management (extends auth.users)

## 🪣 Storage Buckets

Create these 6 buckets in Supabase Storage:

1. **event-images** (Public) - Event cover images
2. **album-images** (Public) - Album covers and album media
3. **partner-logos** (Public) - Collaboration partner logos
4. **gallery-images** (Public) - General gallery images
5. **testimonial-avatars** (Public) - Testimonial profile images
6. **admin-avatars** (Private) - Admin user avatars

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Public read access for public content
- Admin-only write access for all content
- Storage policies for secure file uploads
- Admin authentication via Supabase Auth

## 🚀 Quick Start

### 1. Run Database Schema
```sql
-- Copy and run supabase-schema.sql in Supabase SQL Editor
```

### 2. Create Storage Buckets
- Go to Storage > New Bucket
- Create all 6 buckets listed above
- Set public buckets to "Public"

### 3. Set Up Storage Policies
```sql
-- Copy and run storage-policies.sql in Supabase SQL Editor
```

### 4. Create Admin User
```sql
-- After creating user in Auth, run:
INSERT INTO admin_users (id, email, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@phoenix.com'),
  'admin@phoenix.com',
  'Admin User',
  'admin'
);
```

### 5. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 6. Set Environment Variables
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Key Features

### Admin Dashboard Capabilities
- ✅ Manage Events (create, edit, delete, reorder)
- ✅ Manage Albums (with media upload)
- ✅ Manage Gallery Images
- ✅ Manage Collaborations (with images and steps)
- ✅ Manage Services
- ✅ Manage Testimonials
- ✅ View & Manage Inquiries
- ✅ Edit Site Content
- ✅ Configure Settings
- ✅ Admin Authentication

### Public Website Features
- ✅ Dynamic event listings
- ✅ Event detail pages with steps
- ✅ Album galleries with media
- ✅ General gallery with categories
- ✅ Collaboration/partner listings
- ✅ Services showcase
- ✅ Testimonials display
- ✅ Contact form submissions
- ✅ Dynamic homepage content

## 🔄 Data Flow

### Admin Actions
1. Admin logs in via Supabase Auth
2. Admin creates/edits content via admin dashboard
3. Data saved to Supabase database
4. Images uploaded to Supabase Storage
5. Changes reflected immediately on public site

### Public Site
1. Visitors view public content
2. Data fetched from Supabase (public read access)
3. Images served from Supabase Storage CDN
4. Contact form submissions saved to `inquiries` table

## 📝 Next Steps

After running the SQL files:

1. **Update Frontend**
   - Create Supabase client utility (`src/lib/supabase.ts`)
   - Update `AdminContext.tsx` to use Supabase Auth
   - Update admin pages to fetch/save data from Supabase
   - Update public pages to fetch data from Supabase

2. **Image Upload Integration**
   - Update `ImageUpload` component to use Supabase Storage
   - Implement image optimization on upload
   - Set up CDN URLs for images

3. **Real-time Features** (Optional)
   - Set up real-time subscriptions for inquiries
   - Add live updates for admin dashboard

4. **Email Notifications** (Optional)
   - Set up Supabase Edge Functions for inquiry emails
   - Configure email templates

## 🛠️ Maintenance

### Regular Tasks
- Monitor storage usage
- Review and clean up old inquiries
- Backup database regularly
- Update RLS policies as needed
- Monitor API usage

### Useful Queries
- See `common-queries.sql` for ready-to-use queries
- Dashboard statistics queries included
- Search functionality queries included

## 📚 Documentation

- **Full Setup Guide**: See `SUPABASE_SETUP.md`
- **Common Queries**: See `common-queries.sql`
- **Storage Policies**: See `storage-policies.sql`
- **Schema Details**: See `supabase-schema.sql`

## ⚠️ Important Notes

1. **Never commit `.env` file** with real keys
2. **Keep service_role key secret** - never expose in frontend
3. **Test RLS policies** after setup
4. **Backup database** before major changes
5. **Monitor storage costs** - optimize images before upload

## 🆘 Troubleshooting

Common issues and solutions:

- **RLS blocking queries**: Check policies and admin_users table
- **Storage upload fails**: Verify bucket policies and permissions
- **Auth not working**: Check environment variables and user setup
- **Images not loading**: Verify bucket is public and URLs are correct

See `SUPABASE_SETUP.md` for detailed troubleshooting.

## ✅ Checklist

- [ ] Run `supabase-schema.sql`
- [ ] Create all 6 storage buckets
- [ ] Run `storage-policies.sql`
- [ ] Create first admin user
- [ ] Install `@supabase/supabase-js`
- [ ] Set environment variables
- [ ] Create Supabase client utility
- [ ] Update AdminContext for Supabase Auth
- [ ] Test admin login
- [ ] Test data fetching
- [ ] Test image uploads
- [ ] Verify public site loads data correctly

---

**Ready to start?** Follow the steps in `SUPABASE_SETUP.md`!
