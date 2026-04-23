import type postgres from "postgres";

export type ClientRow = {
  id: string;
  name: string;
  primary_email: string;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  client_id: string;
  slug: string;
  name: string;
  notion_url: string | null;
  sanity_dataset: string | null;
  dashboard_project_key: string | null;
  /** Shown in the client portal footer when set (https://…). */
  client_website_url: string | null;
  created_at: string;
};

export type ProjectWithClientRow = ProjectRow & {
  client_name: string;
  client_primary_email: string;
};

export type InviteRow = {
  id: string;
  project_id: string;
  token_hash: string;
  sent_to_email: string;
  sent_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type InviteWithProjectRow = InviteRow & {
  project_slug: string;
  project_name: string;
  project_notion_url: string | null;
  client_name: string;
};

export type StakeholderInput = { email: string; accesses: string[] };

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function listProjectsWithClient(
  sql: ReturnType<typeof postgres>,
): Promise<ProjectWithClientRow[]> {
  return sql<ProjectWithClientRow[]>`
    SELECT p.id::text AS id,
           p.client_id::text AS client_id,
           p.slug,
           p.name,
           p.notion_url,
           p.sanity_dataset,
           p.dashboard_project_key,
           p.client_website_url,
           p.created_at::text AS created_at,
           c.name AS client_name,
           c.primary_email AS client_primary_email
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    ORDER BY p.created_at DESC
  `;
}

export async function getProjectWithClientById(
  sql: ReturnType<typeof postgres>,
  id: string,
): Promise<ProjectWithClientRow | null> {
  if (!UUID_RE.test(id)) return null;
  const rows = await sql<ProjectWithClientRow[]>`
    SELECT p.id::text AS id,
           p.client_id::text AS client_id,
           p.slug,
           p.name,
           p.notion_url,
           p.sanity_dataset,
           p.dashboard_project_key,
           p.client_website_url,
           p.created_at::text AS created_at,
           c.name AS client_name,
           c.primary_email AS client_primary_email
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    WHERE p.id = ${id}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export type CreateClientInput = {
  name: string;
  primary_email: string;
};

// Each project gets its own `clients` row, even when the email repeats.
// `clients.primary_email` is intentionally non-unique at the schema level
// (only indexed) so operators can manage projects as independent engagements.
export async function createClient(
  sql: ReturnType<typeof postgres>,
  input: CreateClientInput,
): Promise<ClientRow> {
  const rows = await sql<ClientRow[]>`
    INSERT INTO clients (name, primary_email)
    VALUES (${input.name}, ${input.primary_email})
    RETURNING id::text AS id, name, primary_email, created_at::text AS created_at
  `;
  return rows[0];
}

export type CreateProjectInput = {
  client_id: string;
  slug: string;
  name: string;
  notion_url: string | null;
  sanity_dataset: string | null;
  dashboard_project_key: string | null;
};

export async function createProject(
  sql: ReturnType<typeof postgres>,
  input: CreateProjectInput,
): Promise<ProjectRow> {
  const rows = await sql<ProjectRow[]>`
    INSERT INTO projects (
      client_id, slug, name, notion_url, sanity_dataset, dashboard_project_key
    ) VALUES (
      ${input.client_id}::uuid,
      ${input.slug},
      ${input.name},
      ${input.notion_url},
      ${input.sanity_dataset},
      ${input.dashboard_project_key}
    )
    RETURNING id::text AS id, client_id::text AS client_id, slug, name,
              notion_url, sanity_dataset, dashboard_project_key,
              client_website_url,
              created_at::text AS created_at
  `;
  return rows[0];
}

export type UpdateProjectInput = {
  name?: string;
  notion_url?: string | null;
  sanity_dataset?: string | null;
  dashboard_project_key?: string | null;
  client_website_url?: string | null;
};

export async function updateProject(
  sql: ReturnType<typeof postgres>,
  id: string,
  input: UpdateProjectInput,
): Promise<ProjectRow | null> {
  if (!UUID_RE.test(id)) return null;
  const rows = await sql<ProjectRow[]>`
    UPDATE projects
    SET name                  = COALESCE(${input.name ?? null}, name),
        notion_url            = COALESCE(${input.notion_url ?? null}, notion_url),
        sanity_dataset        = COALESCE(${input.sanity_dataset ?? null}, sanity_dataset),
        dashboard_project_key = COALESCE(${input.dashboard_project_key ?? null}, dashboard_project_key),
        client_website_url      = COALESCE(${input.client_website_url ?? null}, client_website_url)
    WHERE id = ${id}::uuid
    RETURNING id::text AS id, client_id::text AS client_id, slug, name,
              notion_url, sanity_dataset, dashboard_project_key,
              client_website_url,
              created_at::text AS created_at
  `;
  return rows[0] ?? null;
}

// Updates the `name` on the `clients` row that owns the given project.
// Because each project has its own `clients` row (see createClient), editing
// here is scoped to a single engagement and will not ripple across projects.
export async function updateClientNameForProject(
  sql: ReturnType<typeof postgres>,
  projectId: string,
  name: string,
): Promise<boolean> {
  if (!UUID_RE.test(projectId)) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE clients
    SET name = ${name}
    FROM projects
    WHERE clients.id = projects.client_id
      AND projects.id = ${projectId}::uuid
    RETURNING clients.id::text AS id
  `;
  return rows.length > 0;
}

export type DeleteProjectResult =
  | { ok: true; project_name: string }
  | { ok: false; reason: "not_found" };

// Deletes a project and its owning `clients` row. Relies on the FK cascade
// from `onboarding_invites` and `onboarding_submissions` → `projects` defined
// in backend/migrations/002_client_onboarding.sql. Each project has its own
// `clients` row (see createClient), so removing the client here is safe and
// keeps the CRM free of orphan client rows.
export async function deleteProjectCascade(
  sql: ReturnType<typeof postgres>,
  id: string,
): Promise<DeleteProjectResult> {
  if (!UUID_RE.test(id)) return { ok: false, reason: "not_found" };
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string; name: string; client_id: string }[]>`
      DELETE FROM projects
      WHERE id = ${id}::uuid
      RETURNING id::text AS id, name, client_id::text AS client_id
    `;
    const deleted = rows[0];
    if (!deleted) return { ok: false, reason: "not_found" } as const;
    await tx`DELETE FROM clients WHERE id = ${deleted.client_id}::uuid`;
    return { ok: true, project_name: deleted.name } as const;
  });
}

export type CreateInviteInput = {
  project_id: string;
  token_hash: string;
  sent_to_email: string;
  sent_by: string;
  expires_at: Date;
};

export async function createInvite(
  sql: ReturnType<typeof postgres>,
  input: CreateInviteInput,
): Promise<InviteRow> {
  const rows = await sql<InviteRow[]>`
    INSERT INTO onboarding_invites (
      project_id, token_hash, sent_to_email, sent_by, expires_at
    ) VALUES (
      ${input.project_id}::uuid,
      ${input.token_hash},
      ${input.sent_to_email},
      ${input.sent_by},
      ${input.expires_at.toISOString()}::timestamptz
    )
    RETURNING id::text AS id, project_id::text AS project_id, token_hash,
              sent_to_email, sent_by,
              expires_at::text AS expires_at,
              used_at::text AS used_at,
              created_at::text AS created_at
  `;
  return rows[0];
}

export async function listInvitesForProject(
  sql: ReturnType<typeof postgres>,
  projectId: string,
): Promise<InviteRow[]> {
  if (!UUID_RE.test(projectId)) return [];
  return sql<InviteRow[]>`
    SELECT id::text AS id, project_id::text AS project_id, token_hash,
           sent_to_email, sent_by,
           expires_at::text AS expires_at,
           used_at::text AS used_at,
           created_at::text AS created_at
    FROM onboarding_invites
    WHERE project_id = ${projectId}::uuid
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function getInviteByTokenHash(
  sql: ReturnType<typeof postgres>,
  tokenHash: string,
): Promise<InviteWithProjectRow | null> {
  const rows = await sql<InviteWithProjectRow[]>`
    SELECT i.id::text AS id,
           i.project_id::text AS project_id,
           i.token_hash,
           i.sent_to_email,
           i.sent_by,
           i.expires_at::text AS expires_at,
           i.used_at::text AS used_at,
           i.created_at::text AS created_at,
           p.slug AS project_slug,
           p.name AS project_name,
           p.notion_url AS project_notion_url,
           c.name AS client_name
    FROM onboarding_invites i
    JOIN projects p ON p.id = i.project_id
    JOIN clients c ON c.id = p.client_id
    WHERE i.token_hash = ${tokenHash}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Team member roster (operator-side CRUD)
//
// The live roster for a project is the latest `onboarding_submissions` row
// (latest by `submitted_at`). The client seeds it via the public form; the
// operator edits it from /internal by mutating the `stakeholders` JSONB.
// We load, mutate in Node, and write back with `sql.json()` (same reason as
// recordSubmissionAndConsumeInvite — avoid jsonb double-encoding).
// ---------------------------------------------------------------------------

export type SubmissionRosterRow = {
  submission_id: string;
  invite_id: string;
  project_id: string;
  project_slug: string;
  project_name: string;
  admin_email: string;
  stakeholders: StakeholderInput[];
  submitted_at: string;
};

export async function getLatestSubmissionForProject(
  sql: ReturnType<typeof postgres>,
  projectId: string,
): Promise<SubmissionRosterRow | null> {
  if (!UUID_RE.test(projectId)) return null;
  const rows = await sql<SubmissionRosterRow[]>`
    SELECT s.id::text AS submission_id,
           s.invite_id::text AS invite_id,
           i.project_id::text AS project_id,
           p.slug AS project_slug,
           p.name AS project_name,
           s.admin_email,
           s.stakeholders,
           s.submitted_at::text AS submitted_at
    FROM onboarding_submissions s
    JOIN onboarding_invites i ON i.id = s.invite_id
    JOIN projects p ON p.id = i.project_id
    WHERE i.project_id = ${projectId}::uuid
    ORDER BY s.submitted_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeAccesses(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const a of raw) {
    if (typeof a !== "string") continue;
    if (!["notion", "cms", "ops"].includes(a)) continue;
    if (!out.includes(a)) out.push(a);
  }
  return out;
}

async function writeStakeholders(
  sql: ReturnType<typeof postgres>,
  submissionId: string,
  next: StakeholderInput[],
): Promise<void> {
  await sql`
    UPDATE onboarding_submissions
    SET stakeholders = ${sql.json(next)}
    WHERE id = ${submissionId}::uuid
  `;
}

export type MemberMutationResult =
  | { ok: true; stakeholders: StakeholderInput[] }
  | {
      ok: false;
      reason:
        | "no_submission"
        | "duplicate"
        | "not_found"
        | "invalid_accesses";
    };

export async function addStakeholder(
  sql: ReturnType<typeof postgres>,
  projectId: string,
  input: StakeholderInput,
): Promise<MemberMutationResult> {
  const sub = await getLatestSubmissionForProject(sql, projectId);
  if (!sub) return { ok: false, reason: "no_submission" };
  const accesses = sanitizeAccesses(input.accesses);
  if (accesses.length === 0) {
    return { ok: false, reason: "invalid_accesses" };
  }
  const email = input.email.trim();
  const dup = sub.stakeholders.some(
    (s) => normalizeEmail(s.email) === normalizeEmail(email),
  );
  if (dup) return { ok: false, reason: "duplicate" };
  const next: StakeholderInput[] = [...sub.stakeholders, { email, accesses }];
  await writeStakeholders(sql, sub.submission_id, next);
  return { ok: true, stakeholders: next };
}

export async function updateStakeholder(
  sql: ReturnType<typeof postgres>,
  projectId: string,
  input: StakeholderInput,
): Promise<MemberMutationResult> {
  const sub = await getLatestSubmissionForProject(sql, projectId);
  if (!sub) return { ok: false, reason: "no_submission" };
  const accesses = sanitizeAccesses(input.accesses);
  if (accesses.length === 0) {
    return { ok: false, reason: "invalid_accesses" };
  }
  const target = normalizeEmail(input.email);
  let found = false;
  const next = sub.stakeholders.map((s) => {
    if (normalizeEmail(s.email) === target) {
      found = true;
      return { email: s.email, accesses };
    }
    return s;
  });
  if (!found) return { ok: false, reason: "not_found" };
  await writeStakeholders(sql, sub.submission_id, next);
  return { ok: true, stakeholders: next };
}

export async function removeStakeholder(
  sql: ReturnType<typeof postgres>,
  projectId: string,
  email: string,
): Promise<MemberMutationResult> {
  const sub = await getLatestSubmissionForProject(sql, projectId);
  if (!sub) return { ok: false, reason: "no_submission" };
  const target = normalizeEmail(email);
  const next = sub.stakeholders.filter(
    (s) => normalizeEmail(s.email) !== target,
  );
  if (next.length === sub.stakeholders.length) {
    return { ok: false, reason: "not_found" };
  }
  await writeStakeholders(sql, sub.submission_id, next);
  return { ok: true, stakeholders: next };
}

export type CreateSubmissionInput = {
  invite_id: string;
  admin_email: string;
  stakeholders: StakeholderInput[];
};

export type CreateSubmissionResult =
  | { ok: true; submission_id: string }
  | { ok: false; error: "already_submitted" | "invite_used_or_expired" };

/**
 * Atomically records the submission and marks the invite used. Fails if the
 * invite is already used, expired, or missing. Caller has already resolved
 * the invite, but we re-check inside the transaction to avoid races.
 */
export async function recordSubmissionAndConsumeInvite(
  sql: ReturnType<typeof postgres>,
  input: CreateSubmissionInput,
): Promise<CreateSubmissionResult> {
  if (!UUID_RE.test(input.invite_id)) {
    return { ok: false, error: "invite_used_or_expired" };
  }
  try {
    return await sql.begin(async (tx) => {
      const claimed = await tx<{ id: string }[]>`
        UPDATE onboarding_invites
        SET used_at = NOW()
        WHERE id = ${input.invite_id}::uuid
          AND used_at IS NULL
          AND expires_at > NOW()
        RETURNING id::text AS id
      `;
      if (claimed.length === 0) {
        return {
          ok: false as const,
          error: "invite_used_or_expired" as const,
        };
      }
      // NOTE: use sql.json() here — an explicit `::jsonb` cast on a bound
      // parameter makes postgres.js infer the param type as jsonb and then
      // re-encode our value, producing a double-encoded JSON scalar string
      // that violates the `stakeholders_is_array` CHECK constraint. PG will
      // coerce the `json` parameter into the column's `jsonb` type on insert.
      const submissionRows = await tx<{ id: string }[]>`
        INSERT INTO onboarding_submissions (invite_id, admin_email, stakeholders)
        VALUES (
          ${input.invite_id}::uuid,
          ${input.admin_email},
          ${sql.json(input.stakeholders)}
        )
        ON CONFLICT (invite_id) DO NOTHING
        RETURNING id::text AS id
      `;
      if (submissionRows.length === 0) {
        return { ok: false as const, error: "already_submitted" as const };
      }
      return { ok: true as const, submission_id: submissionRows[0].id };
    });
  } catch (err) {
    console.error("[onboarding-invite-store] submission tx failed", err);
    return { ok: false, error: "invite_used_or_expired" };
  }
}
