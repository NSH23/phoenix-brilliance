-- Add is_read column to inquiries table
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
