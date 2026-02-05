-- ============================================
-- Common Queries for Phoenix Events
-- ============================================
-- Useful queries for managing your website data

-- ============================================
-- EVENTS QUERIES
-- ============================================

-- Get all active events ordered by display_order
SELECT * FROM events 
WHERE is_active = true 
ORDER BY display_order ASC, created_at DESC;

-- Get event with all its steps
SELECT 
  e.*,
  json_agg(
    json_build_object(
      'id', es.id,
      'step_number', es.step_number,
      'title', es.title,
      'description', es.description,
      'icon', es.icon,
      'image_url', es.image_url
    ) ORDER BY es.step_number
  ) FILTER (WHERE es.id IS NOT NULL) as steps
FROM events e
LEFT JOIN event_steps es ON e.id = es.event_id
WHERE e.is_active = true
GROUP BY e.id
ORDER BY e.display_order ASC;

-- Get event by slug
SELECT * FROM events WHERE slug = 'wedding' AND is_active = true;

-- ============================================
-- ALBUMS QUERIES
-- ============================================

-- Get all albums with event info
SELECT 
  ea.*,
  e.title as event_title,
  e.slug as event_slug,
  COUNT(am.id) as media_count
FROM event_albums ea
JOIN events e ON ea.event_id = e.id
LEFT JOIN album_media am ON ea.id = am.album_id
WHERE e.is_active = true
GROUP BY ea.id, e.title, e.slug
ORDER BY ea.is_featured DESC, ea.event_date DESC;

-- Get album with all media
SELECT 
  ea.*,
  e.title as event_title,
  json_agg(
    json_build_object(
      'id', am.id,
      'type', am.type,
      'url', am.url,
      'youtube_url', am.youtube_url,
      'caption', am.caption,
      'is_featured', am.is_featured,
      'display_order', am.display_order
    ) ORDER BY am.display_order
  ) FILTER (WHERE am.id IS NOT NULL) as media
FROM event_albums ea
JOIN events e ON ea.event_id = e.id
LEFT JOIN album_media am ON ea.id = am.album_id
WHERE ea.id = '<album_id>'
GROUP BY ea.id, e.title;

-- Get featured albums
SELECT * FROM event_albums 
WHERE is_featured = true 
ORDER BY event_date DESC 
LIMIT 6;

-- ============================================
-- GALLERY QUERIES
-- ============================================

-- Get gallery images by category
SELECT * FROM gallery 
WHERE category = 'Wedding' 
ORDER BY is_featured DESC, display_order ASC;

-- Get featured gallery images
SELECT * FROM gallery 
WHERE is_featured = true 
ORDER BY display_order ASC 
LIMIT 12;

-- Get all gallery categories
SELECT DISTINCT category FROM gallery 
WHERE category IS NOT NULL 
ORDER BY category;

-- ============================================
-- COLLABORATIONS QUERIES
-- ============================================

-- Get all active collaborations with images
SELECT 
  c.*,
  json_agg(
    json_build_object(
      'id', ci.id,
      'image_url', ci.image_url,
      'caption', ci.caption,
      'display_order', ci.display_order
    ) ORDER BY ci.display_order
  ) FILTER (WHERE ci.id IS NOT NULL) as images,
  json_agg(
    json_build_object(
      'id', cs.id,
      'step_number', cs.step_number,
      'title', cs.title,
      'description', cs.description
    ) ORDER BY cs.step_number
  ) FILTER (WHERE cs.id IS NOT NULL) as steps
FROM collaborations c
LEFT JOIN collaboration_images ci ON c.id = ci.collaboration_id
LEFT JOIN collaboration_steps cs ON c.id = cs.collaboration_id
WHERE c.is_active = true
GROUP BY c.id
ORDER BY c.display_order ASC;

-- ============================================
-- SERVICES QUERIES
-- ============================================

-- Get all active services
SELECT * FROM services 
WHERE is_active = true 
ORDER BY display_order ASC;

-- ============================================
-- TESTIMONIALS QUERIES
-- ============================================

-- Get featured testimonials
SELECT * FROM testimonials 
WHERE is_featured = true 
ORDER BY display_order ASC, rating DESC 
LIMIT 6;

-- Get testimonials by event type
SELECT * FROM testimonials 
WHERE event_type = 'Wedding' 
ORDER BY rating DESC, created_at DESC;

-- Get all testimonials ordered by rating
SELECT * FROM testimonials 
ORDER BY rating DESC, created_at DESC;

-- ============================================
-- INQUIRIES QUERIES
-- ============================================

-- Get new inquiries
SELECT * FROM inquiries 
WHERE status = 'new' 
ORDER BY created_at DESC;

-- Get inquiries by status
SELECT * FROM inquiries 
WHERE status = 'contacted' 
ORDER BY updated_at DESC;

-- Count inquiries by status
SELECT 
  status,
  COUNT(*) as count
FROM inquiries
GROUP BY status;

-- ============================================
-- SITE CONTENT QUERIES
-- ============================================

-- Get all site content
SELECT * FROM site_content 
ORDER BY section_key;

-- Get specific section content
SELECT * FROM site_content 
WHERE section_key = 'hero';

-- ============================================
-- SITE SETTINGS QUERIES
-- ============================================

-- Get all settings
SELECT * FROM site_settings 
ORDER BY key;

-- Get specific setting
SELECT value FROM site_settings 
WHERE key = 'site_name';

-- ============================================
-- SOCIAL LINKS QUERIES
-- ============================================

-- Get all active social links
SELECT * FROM social_links 
WHERE is_active = true 
ORDER BY platform;

-- ============================================
-- CONTACT INFO QUERIES
-- ============================================

-- Get contact information
SELECT * FROM contact_info LIMIT 1;

-- ============================================
-- ADMIN QUERIES
-- ============================================

-- Get all admin users
SELECT 
  au.*,
  u.email as auth_email,
  u.created_at as auth_created_at
FROM admin_users au
JOIN auth.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Check if user is admin
SELECT is_admin('<user_uuid>');

-- Check if user is admin or moderator
SELECT is_admin_or_moderator('<user_uuid>');

-- ============================================
-- STATISTICS QUERIES
-- ============================================

-- Get dashboard statistics
SELECT 
  (SELECT COUNT(*) FROM events WHERE is_active = true) as total_events,
  (SELECT COUNT(*) FROM event_albums) as total_albums,
  (SELECT COUNT(*) FROM gallery) as total_gallery_images,
  (SELECT COUNT(*) FROM inquiries WHERE status = 'new') as new_inquiries,
  (SELECT COUNT(*) FROM collaborations WHERE is_active = true) as total_partners,
  (SELECT COUNT(*) FROM testimonials) as total_testimonials,
  (SELECT COUNT(*) FROM services WHERE is_active = true) as total_services;

-- Get recent activity (last 10 items)
(
  SELECT 'event' as type, id::text, title as name, created_at 
  FROM events 
  ORDER BY created_at DESC 
  LIMIT 5
)
UNION ALL
(
  SELECT 'album' as type, id::text, title as name, created_at 
  FROM event_albums 
  ORDER BY created_at DESC 
  LIMIT 5
)
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- UPDATE QUERIES
-- ============================================

-- Update event display order
UPDATE events 
SET display_order = CASE id
  WHEN '<id1>' THEN 1
  WHEN '<id2>' THEN 2
  WHEN '<id3>' THEN 3
  -- Add more as needed
END
WHERE id IN ('<id1>', '<id2>', '<id3>');

-- Update album media display order
UPDATE album_media 
SET display_order = <new_order>
WHERE id = '<media_id>';

-- Mark inquiry as contacted
UPDATE inquiries 
SET status = 'contacted', updated_at = NOW()
WHERE id = '<inquiry_id>';

-- Toggle event active status
UPDATE events 
SET is_active = NOT is_active, updated_at = NOW()
WHERE id = '<event_id>';

-- ============================================
-- DELETE QUERIES (Use with caution!)
-- ============================================

-- Delete event (cascades to steps and albums)
DELETE FROM events WHERE id = '<event_id>';

-- Delete album (cascades to media)
DELETE FROM event_albums WHERE id = '<album_id>';

-- Delete inquiry
DELETE FROM inquiries WHERE id = '<inquiry_id>';

-- ============================================
-- SEARCH QUERIES
-- ============================================

-- Search events
SELECT * FROM events 
WHERE 
  title ILIKE '%<search_term>%' OR
  description ILIKE '%<search_term>%' OR
  short_description ILIKE '%<search_term>%'
ORDER BY 
  CASE WHEN title ILIKE '%<search_term>%' THEN 1 ELSE 2 END,
  display_order ASC;

-- Search albums
SELECT 
  ea.*,
  e.title as event_title
FROM event_albums ea
JOIN events e ON ea.event_id = e.id
WHERE 
  ea.title ILIKE '%<search_term>%' OR
  ea.description ILIKE '%<search_term>%' OR
  e.title ILIKE '%<search_term>%'
ORDER BY ea.event_date DESC;

-- Search inquiries
SELECT * FROM inquiries 
WHERE 
  name ILIKE '%<search_term>%' OR
  email ILIKE '%<search_term>%' OR
  message ILIKE '%<search_term>%'
ORDER BY created_at DESC;

-- ============================================
-- BULK OPERATIONS
-- ============================================

-- Bulk update event display orders
UPDATE events 
SET display_order = subquery.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) as new_order
  FROM events
) AS subquery
WHERE events.id = subquery.id;

-- Bulk update album media display orders within an album
UPDATE album_media 
SET display_order = subquery.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) as new_order
  FROM album_media
  WHERE album_id = '<album_id>'
) AS subquery
WHERE album_media.id = subquery.id;

-- ============================================
-- NOTES
-- ============================================
-- Replace <placeholders> with actual values
-- All queries respect RLS policies
-- Use transactions for bulk operations
-- Always test queries in a development environment first
