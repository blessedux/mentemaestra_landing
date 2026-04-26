-- Add per-project Vercel project ID.
-- Run once against your Supabase / Postgres database.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS vercel_project_id TEXT;
