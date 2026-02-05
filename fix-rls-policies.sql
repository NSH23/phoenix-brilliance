-- ============================================
-- Fix RLS Policies for Phoenix Events
-- ============================================
-- This script fixes Row Level Security policies to ensure:
-- 1. Public users can READ all public content
-- 2. Authenticated admin users can CREATE/UPDATE/DELETE
-- ============================================
-- Run this in your Supabase SQL Editor

-- ============================================
-- EVENTS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;

-- Public can view active events (for frontend)
CREATE POLICY "Public can view active events"
  ON events FOR SELECT
  USING (is_active = true);

-- Public can view all events (for admin dashboard - they need to see inactive too)
CREATE POLICY "Public can view all events"
  ON events FOR SELECT
  USING (true);

-- Admins can insert events
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update events
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can delete events
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- EVENT STEPS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view event steps" ON event_steps;
DROP POLICY IF EXISTS "Admins can manage event steps" ON event_steps;

-- Public can view steps for active events
CREATE POLICY "Public can view event steps"
  ON event_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_steps.event_id 
      AND events.is_active = true
    )
  );

-- Public can view all steps (for admin)
CREATE POLICY "Public can view all event steps"
  ON event_steps FOR SELECT
  USING (true);

-- Admins can insert steps
CREATE POLICY "Admins can insert event steps"
  ON event_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update steps
CREATE POLICY "Admins can update event steps"
  ON event_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can delete steps
CREATE POLICY "Admins can delete event steps"
  ON event_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- EVENT ALBUMS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view albums" ON event_albums;
DROP POLICY IF EXISTS "Admins can manage albums" ON event_albums;

-- Public can view albums
CREATE POLICY "Public can view albums"
  ON event_albums FOR SELECT
  USING (true);

-- Admins can insert albums
CREATE POLICY "Admins can insert albums"
  ON event_albums FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update albums
CREATE POLICY "Admins can update albums"
  ON event_albums FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can delete albums
CREATE POLICY "Admins can delete albums"
  ON event_albums FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- ALBUM MEDIA TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view album media" ON album_media;
DROP POLICY IF EXISTS "Admins can manage album media" ON album_media;

-- Public can view media
CREATE POLICY "Public can view album media"
  ON album_media FOR SELECT
  USING (true);

-- Admins can insert media
CREATE POLICY "Admins can insert album media"
  ON album_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update media
CREATE POLICY "Admins can update album media"
  ON album_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can delete media
CREATE POLICY "Admins can delete album media"
  ON album_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- GALLERY TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view gallery" ON gallery;
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;

-- Public can view gallery
CREATE POLICY "Public can view gallery"
  ON gallery FOR SELECT
  USING (true);

-- Admins can insert gallery images
CREATE POLICY "Admins can insert gallery"
  ON gallery FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update gallery
CREATE POLICY "Admins can update gallery"
  ON gallery FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can delete gallery
CREATE POLICY "Admins can delete gallery"
  ON gallery FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- TESTIMONIALS TABLE (if exists)
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;

-- Public can view testimonials
CREATE POLICY "Public can view testimonials"
  ON testimonials FOR SELECT
  USING (true);

-- Admins can insert testimonials
CREATE POLICY "Admins can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update testimonials
CREATE POLICY "Admins can update testimonials"
  ON testimonials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );

-- Admins can delete testimonials
CREATE POLICY "Admins can delete testimonials"
  ON testimonials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid()
    )
  );
