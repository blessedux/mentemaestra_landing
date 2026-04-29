-- Analytics reports history: run once against Supabase / Postgres.
-- Stores a minimal ledger of sent GSC analytics reports.

CREATE TABLE IF NOT EXISTS project_analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sent_to text NOT NULL,
  sent_by text NOT NULL,
  subject text NOT NULL,
  date_start date NOT NULL,
  date_end date NOT NULL,
  html_body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_analytics_reports_project_id
  ON project_analytics_reports (project_id, created_at DESC);

-- Prevent duplicates for the same reporting period + recipient.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_analytics_reports_period_recipient
  ON project_analytics_reports (project_id, sent_to, date_start, date_end);

-- v2: exact email HTML for portal history (safe to run on existing DBs)
ALTER TABLE project_analytics_reports
  ADD COLUMN IF NOT EXISTS html_body text;

