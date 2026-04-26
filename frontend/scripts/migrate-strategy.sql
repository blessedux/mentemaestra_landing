-- Run once against your Supabase / Postgres database.
-- Analytics strategy: daily per-project analyses + per-suggestion chat summaries.

-- Daily strategy analyses (one per project per day, upserted on every page load)
CREATE TABLE IF NOT EXISTS strategy_analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  strategy      JSONB NOT NULL,
  model         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, analysis_date)
);

CREATE INDEX IF NOT EXISTS idx_strategy_analyses_project
  ON strategy_analyses (project_id, analysis_date DESC);

-- One rolling summary log per suggestion per analysis.
-- Instead of storing every message, we summarize conversations with the LLM
-- to keep token usage and storage minimal.
CREATE TABLE IF NOT EXISTS strategy_chat_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id         UUID NOT NULL REFERENCES strategy_analyses(id) ON DELETE CASCADE,
  suggestion_type     TEXT NOT NULL CHECK (suggestion_type IN ('seo', 'marketing')),
  suggestion_idx      INTEGER NOT NULL,
  -- LLM-generated rolling summary (replaces raw message history)
  summary             TEXT NOT NULL DEFAULT '',
  -- Last exchange saved for conversational continuity on re-open
  last_user_msg       TEXT,
  last_assistant_msg  TEXT,
  -- If the user corrected the suggestion over chat, stores the revised action
  revised_action      TEXT,
  turn_count          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (analysis_id, suggestion_type, suggestion_idx)
);

CREATE INDEX IF NOT EXISTS idx_strategy_chat_logs_analysis
  ON strategy_chat_logs (analysis_id);

-- Idempotent migration: add revised_action if table already existed without it
ALTER TABLE strategy_chat_logs
  ADD COLUMN IF NOT EXISTS revised_action TEXT;
