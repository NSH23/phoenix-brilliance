-- ============================================
-- Services – optional seed (run after supabase-schema.sql)
-- ============================================
-- Inserts only when the services table is empty.

INSERT INTO services (title, description, icon, features, is_active, display_order)
SELECT * FROM (VALUES
  ) AS v(title, description, icon, features, is_active, display_order)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);
