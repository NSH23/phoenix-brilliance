-- ============================================
-- team_documents – employee documents (private)
-- ============================================
-- Run after team-schema.sql
-- Files are stored in storage bucket: team-documents (private)

CREATE TABLE IF NOT EXISTS team_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  name TEXT NOT NULL,              -- display name
  file_path TEXT NOT NULL,        -- path in team-documents bucket
  file_type TEXT,                 -- mime or extension, optional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_documents_team_id ON team_documents(team_id);

ALTER TABLE team_documents ENABLE ROW LEVEL SECURITY;

-- Only admins can manage team documents
CREATE POLICY "Admins can manage team_documents"
  ON team_documents FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE TRIGGER update_team_documents_updated_at
  BEFORE UPDATE ON team_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
