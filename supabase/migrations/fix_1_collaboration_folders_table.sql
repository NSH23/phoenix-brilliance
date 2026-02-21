-- ============================================
-- FIX 1: Create collaboration_folders table (if not exists)
-- Run this first in Supabase SQL Editor.
-- ============================================

CREATE TABLE IF NOT EXISTS collaboration_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES collaboration_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collaboration_folders_collaboration_id ON collaboration_folders(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_folders_parent_id ON collaboration_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_folders_display_order ON collaboration_folders(collaboration_id, display_order);
