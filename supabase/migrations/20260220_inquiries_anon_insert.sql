-- Ensure anyone can insert inquiries (fixes 401 on lead capture / contact form).
-- Policy with no TO clause applies to all roles (anon, authenticated, etc.).
DROP POLICY IF EXISTS "Enable insert for public" ON inquiries;
DROP POLICY IF EXISTS "Allow anon to insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow authenticated to insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow all to insert inquiries" ON inquiries;

CREATE POLICY "Allow all to insert inquiries"
ON inquiries FOR INSERT
WITH CHECK (true);
