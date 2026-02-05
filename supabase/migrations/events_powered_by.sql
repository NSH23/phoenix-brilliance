-- Add powered_by column to events table
-- Shown on homepage when set; hidden when empty
ALTER TABLE events
ADD COLUMN IF NOT EXISTS powered_by TEXT;
