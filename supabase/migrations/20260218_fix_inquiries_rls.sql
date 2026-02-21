-- Enable RLS on inquiries if not already enabled
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public access to insert inquiries (for contact form and lead capture)
CREATE POLICY "Public can insert inquiries"
ON inquiries FOR INSERT
WITH CHECK (true);

-- Allow admins to view all inquiries
CREATE POLICY "Admins can view inquiries"
ON inquiries FOR SELECT
USING (auth.uid() IN (SELECT id FROM admin_users));

-- Allow admins to update inquiries
CREATE POLICY "Admins can update inquiries"
ON inquiries FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));

-- Allow admins to delete inquiries
CREATE POLICY "Admins can delete inquiries"
ON inquiries FOR DELETE
USING (auth.uid() IN (SELECT id FROM admin_users));
