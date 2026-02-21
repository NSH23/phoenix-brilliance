-- Add instagram_id and venue columns to inquiries table
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS instagram_id TEXT,
ADD COLUMN IF NOT EXISTS venue TEXT;

-- Index for searching/filtering
CREATE INDEX IF NOT EXISTS idx_inquiries_venue ON inquiries(venue);
