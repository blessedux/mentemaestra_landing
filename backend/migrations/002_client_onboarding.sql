-- Client access onboarding: internal CRM + tokenized public form.
-- See docs/client-access-onboarding-crm.md. Mirrors 001_bookings.sql style:
-- UUID PK via gen_random_uuid(), TIMESTAMPTZ defaults via NOW().
--
-- token_hash stores sha256(token [+ optional pepper]) as lowercase hex TEXT
-- (64 chars). TEXT (not BYTEA) keeps parity with the postgres.js driver's
-- string bindings used across src/lib and makes psql inspection readable.

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_primary_email ON clients (primary_email);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  notion_url TEXT,
  sanity_dataset TEXT,
  dashboard_project_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_slug_shape_chk CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$')
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);

CREATE TABLE IF NOT EXISTS onboarding_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  sent_to_email TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_invites_token_hash_len_chk CHECK (char_length(token_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_project_id ON onboarding_invites (project_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_invites_expires_at ON onboarding_invites (expires_at);

CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL UNIQUE REFERENCES onboarding_invites (id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  stakeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_submissions_stakeholders_is_array CHECK (jsonb_typeof(stakeholders) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_invite_id ON onboarding_submissions (invite_id);
