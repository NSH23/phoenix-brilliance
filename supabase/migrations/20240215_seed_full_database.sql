-- ============================================
-- PHOENIX EVENTS - INITIAL SEED DATA
-- ============================================
-- Run this in Supabase SQL Editor to populate your site with initial content.
-- This ensures the site doesn't look empty.

-- 1. Content Media (Hero Video & Reel Moments)
--    Note: Using the file paths as URLs. In production, these should be Storage URLs.
INSERT INTO content_media (category, title, url, display_order, is_active)
VALUES
  ('hero', 'Hero Video 1', '/1.mp4', 0, true),
  ('hero', 'Hero Reel 1', '/reel 1.mp4', 1, true),
  ('hero', 'Hero Video 3', '/3.MP4', 2, true),
  ('moment', 'Moment 1', '/4.mp4', 0, true),
  ('moment', 'Moment 2', '/5.MP4', 1, true),
  ('moment', 'Moment 3', '/6.mp4', 2, true),
  ('moment', 'Moment 4', '/7.MP4', 3, true),
  ('moment', 'Moment 1 (Repeat)', '/1.mp4', 4, true),
  ('moment', 'Moment Reel 1', '/reel 1.mp4', 5, true);

-- 2. Services
--    Note: Using Unsplash images as placeholders where applicable.
INSERT INTO services (title, description, icon, image_url, features, is_active, display_order)
VALUES
  ('Luxury Wedding Planning', 'From the first proposal to the final farewell, we curate seamless, unforgettable wedding experiences crafted with elegance, precision, and emotion.', 'Crown', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', ARRAY['Full Planning', 'Day-of Coordination'], true, 0),
  ('Theme & Décor Design', 'Bespoke décor concepts, floral artistry, and immersive styling that transform venues into breathtaking visual stories.', 'Palette', 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800&q=80', ARRAY['Custom Themes', 'Floral Design'], true, 1),
  ('Corporate Event Production', 'Professional, brand-driven corporate events designed with strategic planning, premium staging, and flawless execution.', 'Building2', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80', ARRAY['Brand Launch', 'Conferences'], true, 2),
  ('Private Celebrations', 'From intimate gatherings to grand birthday soirées, we design vibrant celebrations tailored to your personality and vision.', 'Gift', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80', ARRAY['Birthdays', 'Anniversaries'], true, 3),
  ('Stage, Lighting & Sound', 'Cinematic lighting, immersive soundscapes, and grand stage setups that elevate every moment to a spectacular experience.', 'Speaker', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', ARRAY['Audio Visual', 'Stage Design'], true, 4),
  ('Photography & Films', 'Emotion-driven photography and cinematic storytelling that preserves your most precious memories forever.', 'Camera', 'https://images.unsplash.com/photo-1520854221256-17451cc330e7?w=800&q=80', ARRAY['Candid', 'Cinematography'], true, 5),
  ('Artist & Entertainment', 'Curated DJs, live performers, anchors, and entertainers to energize your celebration and captivate your guests.', 'Mic2', 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80', ARRAY['Live Bands', 'DJs', 'Anchors'], true, 6),
  ('Venue Curation', 'Exclusive partnerships with premium venues and seamless coordination to ensure the perfect setting for your event.', 'MapPin', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', ARRAY['Venue Scouting', 'Negotiation'], true, 7);

-- 3. Events (Sample)
INSERT INTO events (title, slug, description, short_description, cover_image, is_active, display_order)
VALUES
  ('Royal Rajasthan Wedding', 'royal-rajasthan-wedding', 'A grand celebration in the heart of Jaipur.', 'A royal union.', '/gallery wedding.jpg', true, 0),
  ('Beachside Engagement', 'beachside-engagement', 'Sunset vows by the sea in Goa.', 'Sunset love.', '/engagement.jpg', true, 1),
  ('Haldi Ceremony', 'haldi-ceremony', 'Vibrant yellow hues and joy.', 'Haldi celebration.', '/haldi.jpg', true, 2);

-- 4. Collaborations / Partners (Sample)
INSERT INTO collaborations (name, logo_url, description, is_active, display_order)
VALUES
  ('Grand Hyatt', null, 'Luxury Hotel Partner', true, 0),
  ('Marriott', null, 'Premium Venue Partner', true, 1),
  ('Taj Hotels', null, 'Heritage Partner', true, 2);
