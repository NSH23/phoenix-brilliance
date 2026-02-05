-- ============================================
-- Team (Employees) – manage staff/team members
-- ============================================
-- Run after supabase-schema.sql (depends on admin_users, update_updated_at_column)

CREATE TABLE IF NOT EXISTS team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  designation TEXT NOT NULL,           -- role / job title
  aadhaar_card TEXT,                  -- store securely; mask in UI when displaying
  age INTEGER CHECK (age IS NULL OR (age >= 18 AND age <= 100)),
  salary NUMERIC(12, 2),              -- optional, sensitive
  join_date DATE,
  department TEXT,
  emergency_contact TEXT,
  notes TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_is_active ON team(is_active);
CREATE INDEX IF NOT EXISTS idx_team_designation ON team(designation);
CREATE INDEX IF NOT EXISTS idx_team_department ON team(department);
CREATE INDEX IF NOT EXISTS idx_team_display_order ON team(display_order);
CREATE INDEX IF NOT EXISTS idx_team_join_date ON team(join_date DESC);

ALTER TABLE team ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage team (sensitive HR data)
CREATE POLICY "Admins can manage team"
  ON team FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_team_updated_at
  BEFORE UPDATE ON team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
