-- Add optional banner image URL for collaboration (hero/banner on venue page)
ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS banner_url TEXT;
