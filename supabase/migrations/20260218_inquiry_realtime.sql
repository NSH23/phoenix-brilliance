-- Enable Realtime for inquiries so admin dashboard can show new inquiry toasts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inquiries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
  END IF;
END $$;
