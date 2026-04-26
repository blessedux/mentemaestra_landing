-- GSC dashboard: run once against your Supabase / Postgres database.
-- Creates the table that stores per-project Google Search Console OAuth credentials.

CREATE TABLE IF NOT EXISTS project_gsc_credentials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  property_url  TEXT NOT NULL,           -- e.g. "https://example.com/" or "sc-domain:example.com"
  refresh_token TEXT NOT NULL,           -- AES-GCM encrypted, base64-encoded
  scope         TEXT,                    -- space-separated OAuth scopes granted
  connected_email TEXT,                  -- Google account email used to connect
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ            -- non-null = disconnected / revoked

  -- Only one active (non-revoked) credential per project is meaningful,
  -- but we allow multiple rows for history; the app always uses the latest
  -- non-revoked row.
);

CREATE INDEX IF NOT EXISTS idx_project_gsc_creds_project_id
  ON project_gsc_credentials (project_id);
