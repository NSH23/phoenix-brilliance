-- ============================================
-- Phoenix Events & Production - Supabase Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Make sure to enable Row Level Security (RLS) after running

-- ============================================
-- 1. ADMIN USERS TABLE
-- ============================================
-- This extends Supabase auth.users with admin-specific fields
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin users
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'));

-- Policy: Admins can update admin users
CREATE POLICY "Admins can update admin users"
  ON admin_users FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'));

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_display_order ON events(display_order);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active events
CREATE POLICY "Public can view active events"
  ON events FOR SELECT
  USING (is_active = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 3. EVENT STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, step_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_steps_event_id ON event_steps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_steps_step_number ON event_steps(event_id, step_number);

-- Enable RLS
ALTER TABLE event_steps ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view steps for active events
CREATE POLICY "Public can view event steps"
  ON event_steps FOR SELECT
  USING (
    event_id IN (SELECT id FROM events WHERE is_active = true)
  );

-- Policy: Admins can manage event steps
CREATE POLICY "Admins can manage event steps"
  ON event_steps FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 4. EVENT ALBUMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  event_date DATE,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_albums_event_id ON event_albums(event_id);
CREATE INDEX IF NOT EXISTS idx_event_albums_is_featured ON event_albums(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_albums_event_date ON event_albums(event_date DESC);

-- Enable RLS
ALTER TABLE event_albums ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view albums
CREATE POLICY "Public can view albums"
  ON event_albums FOR SELECT
  USING (true);

-- Policy: Admins can manage albums
CREATE POLICY "Admins can manage albums"
  ON event_albums FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 5. ALBUM MEDIA TABLE (Images + Videos)
-- ============================================
CREATE TABLE IF NOT EXISTS album_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES event_albums(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT,
  youtube_url TEXT,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_album_media_album_id ON album_media(album_id);
CREATE INDEX IF NOT EXISTS idx_album_media_type ON album_media(type);
CREATE INDEX IF NOT EXISTS idx_album_media_display_order ON album_media(album_id, display_order);
CREATE INDEX IF NOT EXISTS idx_album_media_is_featured ON album_media(is_featured);

-- Enable RLS
ALTER TABLE album_media ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view media
CREATE POLICY "Public can view album media"
  ON album_media FOR SELECT
  USING (true);

-- Policy: Admins can manage media
CREATE POLICY "Admins can manage album media"
  ON album_media FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 6. GALLERY TABLE (General Gallery Images)
-- ============================================
-- Note: For row-based homepage gallery, run supabase/migrations/gallery_rows_and_frames.sql
-- to add row_index column and frame template settings.
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  row_index INTEGER NOT NULL DEFAULT 0,  -- Which row (0, 1, 2...) for homepage layout
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_is_featured ON gallery(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_display_order ON gallery(display_order);

-- Enable RLS
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view gallery
CREATE POLICY "Public can view gallery"
  ON gallery FOR SELECT
  USING (true);

-- Policy: Admins can manage gallery
CREATE POLICY "Admins can manage gallery"
  ON gallery FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 7. COLLABORATIONS TABLE (Partners/Venues)
-- ============================================
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  location TEXT,
  map_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collaborations_is_active ON collaborations(is_active);
CREATE INDEX IF NOT EXISTS idx_collaborations_display_order ON collaborations(display_order);

-- Enable RLS
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active collaborations
CREATE POLICY "Public can view active collaborations"
  ON collaborations FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage collaborations
CREATE POLICY "Admins can manage collaborations"
  ON collaborations FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 8. COLLABORATION IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_images_collab_id ON collaboration_images(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_images_display_order ON collaboration_images(collaboration_id, display_order);

-- Enable RLS
ALTER TABLE collaboration_images ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view collaboration images
CREATE POLICY "Public can view collaboration images"
  ON collaboration_images FOR SELECT
  USING (
    collaboration_id IN (SELECT id FROM collaborations WHERE is_active = true)
  );

-- Policy: Admins can manage collaboration images
CREATE POLICY "Admins can manage collaboration images"
  ON collaboration_images FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 9. COLLABORATION STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collaboration_id, step_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_steps_collab_id ON collaboration_steps(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_steps_step_number ON collaboration_steps(collaboration_id, step_number);

-- Enable RLS
ALTER TABLE collaboration_steps ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view collaboration steps
CREATE POLICY "Public can view collaboration steps"
  ON collaboration_steps FOR SELECT
  USING (
    collaboration_id IN (SELECT id FROM collaborations WHERE is_active = true)
  );

-- Policy: Admins can manage collaboration steps
CREATE POLICY "Admins can manage collaboration steps"
  ON collaboration_steps FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 10. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  features TEXT[], -- Array of feature strings
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active services
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage services
CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 10b. BEFORE_AFTER TABLE (Homepage comparison sliders)
-- ============================================
-- See supabase/migrations/before_after.sql for full migration
-- CREATE TABLE IF NOT EXISTS before_after (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   description TEXT,
--   before_image_url TEXT NOT NULL,
--   after_image_url TEXT NOT NULL,
--   display_order INTEGER NOT NULL DEFAULT 0,
--   is_active BOOLEAN NOT NULL DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================
-- 11. TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  avatar TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  event_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_event_type ON testimonials(event_type);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating DESC);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view testimonials
CREATE POLICY "Public can view testimonials"
  ON testimonials FOR SELECT
  USING (true);

-- Policy: Admins can manage testimonials
CREATE POLICY "Admins can manage testimonials"
  ON testimonials FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 12. INQUIRIES TABLE (Contact Form Submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  notes TEXT, -- Admin notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

-- Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert inquiries
CREATE POLICY "Public can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view and manage inquiries
CREATE POLICY "Admins can manage inquiries"
  ON inquiries FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 13. SITE CONTENT TABLE (Editable Text Content)
-- ============================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL, -- e.g., 'hero', 'events', 'gallery', etc.
  title TEXT,
  subtitle TEXT,
  description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view site content
CREATE POLICY "Public can view site content"
  ON site_content FOR SELECT
  USING (true);

-- Policy: Admins can manage site content
CREATE POLICY "Admins can manage site content"
  ON site_content FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 14. SITE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- e.g., 'site_name', 'contact_email', etc.
  value TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'json')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view settings
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Policy: Admins can manage settings
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 15. SOCIAL LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE NOT NULL, -- 'facebook', 'instagram', 'youtube', 'whatsapp'
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_links_platform ON social_links(platform);
CREATE INDEX IF NOT EXISTS idx_social_links_is_active ON social_links(is_active);

-- Enable RLS
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active social links
CREATE POLICY "Public can view active social links"
  ON social_links FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage social links
CREATE POLICY "Admins can manage social links"
  ON social_links FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- 16. CONTACT INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only allow one row
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_info_single ON contact_info((1));

-- Enable RLS
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view contact info
CREATE POLICY "Public can view contact info"
  ON contact_info FOR SELECT
  USING (true);

-- Policy: Admins can manage contact info
CREATE POLICY "Admins can manage contact info"
  ON contact_info FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_steps_updated_at BEFORE UPDATE ON event_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_albums_updated_at BEFORE UPDATE ON event_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_album_media_updated_at BEFORE UPDATE ON album_media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at BEFORE UPDATE ON collaborations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_images_updated_at BEFORE UPDATE ON collaboration_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_steps_updated_at BEFORE UPDATE ON collaboration_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA SEEDING
-- ============================================

-- Insert default site content sections
INSERT INTO site_content (section_key, title, subtitle, description, cta_text, cta_link)
VALUES
  ('hero', 'Creating Magical Moments', 'Your Dream Events, Perfectly Executed', 'We bring your vision to life with exceptional event planning and production services.', 'Get Started', '/contact'),
  ('events', 'Our Event Types', 'Celebrating Life''s Special Moments', 'From intimate gatherings to grand celebrations, we handle every detail.', 'View All Events', '/events'),
  ('services', 'Our Services', 'Everything You Need for a Perfect Event', 'Comprehensive event solutions tailored to your needs.', 'Learn More', '#services'),
  ('gallery', 'Our Gallery', 'Capturing Beautiful Memories', 'Take a look at our recent work and see the magic we create.', 'View Gallery', '/gallery'),
  ('partners', 'Our Partners', 'Trusted Venues & Collaborators', 'We work with the finest venues and partners to deliver exceptional experiences.', 'View Partners', '/collaborations'),
  ('testimonials', 'What Our Clients Say', 'Trusted by Hundreds of Happy Clients', 'Don''t just take our word for it - hear from those who''ve experienced our service.', NULL, NULL),
  ('why-us', 'Why Choose Us', 'Excellence in Every Detail', 'We combine creativity, expertise, and dedication to make your event unforgettable.', 'Contact Us', '/contact')
ON CONFLICT (section_key) DO NOTHING;

-- Insert default social links
INSERT INTO social_links (platform, url, is_active)
VALUES
  ('facebook', 'https://facebook.com/phoenixevents', true),
  ('instagram', 'https://instagram.com/phoenixevents', true),
  ('youtube', 'https://youtube.com/@phoenixevents', true),
  ('whatsapp', '+919876543210', true)
ON CONFLICT (platform) DO NOTHING;

-- Insert default contact info
INSERT INTO contact_info (email, phone, address)
VALUES
  ('info@phoenixevents.com', '+91 98765 43210', 'Phoenix Events, 123 Event Street, Mumbai, Maharashtra 400001')
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, type)
VALUES
  ('site_name', 'Phoenix Events & Production', 'text'),
  ('tagline', 'Creating Magical Moments', 'text'),
  ('maintenance_mode', 'false', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================
-- Note: Storage buckets need to be created via Supabase Dashboard or Storage API
-- Run these commands in Supabase SQL Editor or use the Storage API

-- Create storage buckets (if they don't exist)
-- These will be created via Supabase Dashboard: Storage > New Bucket

-- Bucket names:
-- 1. event-images (for event cover images)
-- 2. album-images (for album cover images and album media)
-- 3. partner-logos (for collaboration logos)
-- 4. gallery-images (for general gallery images)
-- 5. testimonial-avatars (for testimonial avatars)
-- 6. admin-avatars (for admin user avatars)

-- Storage Policies (Run these after creating buckets)
-- Replace 'event-images' with actual bucket name

-- Policy for event-images bucket
-- CREATE POLICY "Public can view event images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'event-images');

-- CREATE POLICY "Admins can upload event images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'event-images' AND
--     auth.uid() IN (SELECT id FROM admin_users)
--   );

-- CREATE POLICY "Admins can update event images"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'event-images' AND
--     auth.uid() IN (SELECT id FROM admin_users)
--   );

-- CREATE POLICY "Admins can delete event images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'event-images' AND
--     auth.uid() IN (SELECT id FROM admin_users)
--   );

-- Repeat similar policies for other buckets:
-- - album-images
-- - partner-logos
-- - gallery-images
-- - testimonial-avatars
-- - admin-avatars

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION is_admin_or_moderator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- Schema created successfully!
-- 
-- Next steps:
-- 1. Create storage buckets in Supabase Dashboard > Storage
-- 2. Set up storage policies (see comments above)
-- 3. Create your first admin user (see instructions below)
-- 4. Test the connection from your frontend
--
-- To create an admin user:
-- 1. Sign up a user via Supabase Auth
-- 2. Get the user's UUID from auth.users
-- 3. Insert into admin_users:
--    INSERT INTO admin_users (id, email, name, role)
--    VALUES ('<user-uuid>', 'admin@phoenix.com', 'Admin User', 'admin');
