-- Inquiry updates: is_read for notification state; email remains required in DB, use placeholder in app if blank
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
