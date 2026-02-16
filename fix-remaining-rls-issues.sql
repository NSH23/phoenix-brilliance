-- ============================================
-- Fix Remaining RLS Policy Performance Issues
-- ============================================
-- This script fixes the remaining 80 "Multiple Permissive Policies" warnings
-- 
-- Problem: After first fix, we have:
--   - "Public and admins can view X" (SELECT policy)
--   - "Admins can manage X" (FOR ALL policy, which includes SELECT)
-- 
-- Solution: Change "Admins can manage X" from FOR ALL to only INSERT/UPDATE/DELETE
-- This removes SELECT from admin management policies, leaving only the consolidated SELECT policy
--s
-- IMPORTANT: This preserves exact same functionality - nothing breaks!
-- Run this AFTER fix-all-rls-performance-issues.sql
-- ============================================

-- ============================================
-- 1. EVENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage events" ON events;

-- Admin INSERT/UPDATE/DELETE only (SELECT handled by consolidated policy)
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 2. EVENT_STEPS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage event steps" ON event_steps;

CREATE POLICY "Admins can insert event steps"
  ON event_steps FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update event steps"
  ON event_steps FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete event steps"
  ON event_steps FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 3. EVENT_ALBUMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage albums" ON event_albums;

CREATE POLICY "Admins can insert albums"
  ON event_albums FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update albums"
  ON event_albums FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete albums"
  ON event_albums FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 4. ALBUM_MEDIA TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage album media" ON album_media;

CREATE POLICY "Admins can insert album media"
  ON album_media FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update album media"
  ON album_media FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete album media"
  ON album_media FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 5. GALLERY TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;

CREATE POLICY "Admins can insert gallery"
  ON gallery FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update gallery"
  ON gallery FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete gallery"
  ON gallery FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 6. COLLABORATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage collaborations" ON collaborations;

CREATE POLICY "Admins can insert collaborations"
  ON collaborations FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update collaborations"
  ON collaborations FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete collaborations"
  ON collaborations FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 7. COLLABORATION_IMAGES TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage collaboration images" ON collaboration_images;

CREATE POLICY "Admins can insert collaboration images"
  ON collaboration_images FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update collaboration images"
  ON collaboration_images FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete collaboration images"
  ON collaboration_images FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 8. COLLABORATION_STEPS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage collaboration steps" ON collaboration_steps;

CREATE POLICY "Admins can insert collaboration steps"
  ON collaboration_steps FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update collaboration steps"
  ON collaboration_steps FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete collaboration steps"
  ON collaboration_steps FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 9. SERVICES TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage services" ON services;

CREATE POLICY "Admins can insert services"
  ON services FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 10. TESTIMONIALS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;

CREATE POLICY "Admins can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update testimonials"
  ON testimonials FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete testimonials"
  ON testimonials FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 11. SITE_CONTENT TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;

CREATE POLICY "Admins can insert site content"
  ON site_content FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update site content"
  ON site_content FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete site content"
  ON site_content FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 12. SITE_SETTINGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;

CREATE POLICY "Admins can insert site settings"
  ON site_settings FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete site settings"
  ON site_settings FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 13. SOCIAL_LINKS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage social links" ON social_links;

CREATE POLICY "Admins can insert social links"
  ON social_links FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update social links"
  ON social_links FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete social links"
  ON social_links FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 14. CONTACT_INFO TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage contact info" ON contact_info;

CREATE POLICY "Admins can insert contact info"
  ON contact_info FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update contact info"
  ON contact_info FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete contact info"
  ON contact_info FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 15. WHY_CHOOSE_US_STATS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage why choose us stats" ON why_choose_us_stats;

CREATE POLICY "Admins can insert why choose us stats"
  ON why_choose_us_stats FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update why choose us stats"
  ON why_choose_us_stats FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete why choose us stats"
  ON why_choose_us_stats FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 16. WHY_CHOOSE_US_REASONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage why choose us reasons" ON why_choose_us_reasons;

CREATE POLICY "Admins can insert why choose us reasons"
  ON why_choose_us_reasons FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update why choose us reasons"
  ON why_choose_us_reasons FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete why choose us reasons"
  ON why_choose_us_reasons FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 17. PAGE_HERO_CONTENT TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage page hero content" ON page_hero_content;

CREATE POLICY "Admins can insert page hero content"
  ON page_hero_content FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update page hero content"
  ON page_hero_content FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete page hero content"
  ON page_hero_content FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 18. TEAM TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage team" ON team;

CREATE POLICY "Admins can insert team"
  ON team FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update team"
  ON team FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete team"
  ON team FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 19. EVENT_IMAGES TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage event images" ON event_images;

CREATE POLICY "Admins can insert event images"
  ON event_images FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update event images"
  ON event_images FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete event images"
  ON event_images FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- 20. BEFORE_AFTER TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage before_after" ON before_after;

CREATE POLICY "Admins can insert before_after"
  ON before_after FOR INSERT
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can update before_after"
  ON before_after FOR UPDATE
  USING (is_admin_or_moderator_user((select auth.uid())))
  WITH CHECK (is_admin_or_moderator_user((select auth.uid())));

CREATE POLICY "Admins can delete before_after"
  ON before_after FOR DELETE
  USING (is_admin_or_moderator_user((select auth.uid())));

-- ============================================
-- Summary
-- ============================================
-- Fixed Issues:
-- ✅ Removed SELECT from all "Admins can manage X" policies
-- ✅ Split FOR ALL policies into separate INSERT/UPDATE/DELETE policies
-- ✅ Total: 80 remaining warnings resolved
--
-- Functionality Preserved:
-- ✅ Public users can still view all public content
-- ✅ Admins can still view all content (via consolidated SELECT policies)
-- ✅ Admins can still manage all content (INSERT/UPDATE/DELETE)
-- ✅ All existing queries will work exactly the same
-- ✅ No breaking changes
