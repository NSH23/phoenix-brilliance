-- ============================================
-- FIX 3: Set folder_id to NULL where it points to non-existent folder (fixes 23503 / 409)
-- Run this in Supabase SQL Editor after FIX 1 and FIX 2.
-- ============================================

UPDATE collaboration_images ci
SET folder_id = NULL
WHERE ci.folder_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM collaboration_folders cf WHERE cf.id = ci.folder_id);
