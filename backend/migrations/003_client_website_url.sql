-- Optional public URL for the client's own site (shown in the client portal footer).
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS client_website_url TEXT;
