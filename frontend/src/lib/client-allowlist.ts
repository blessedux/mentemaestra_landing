import type postgres from "postgres";

import {
  getLatestSubmissionForProject,
  type ProjectRow,
  type StakeholderInput,
} from "@/lib/onboarding-invite-store";

/**
 * Derives the live allowlist for a project from the latest `onboarding_submissions`
 * row: `admin_email ∪ stakeholders[*].email` (lowercased). Operator edits to
 * stakeholders from /internal are reflected here immediately since we always
 * read the latest submission.
 */

export type ProjectBySlugRow = ProjectRow;

export async function getProjectBySlug(
  sql: ReturnType<typeof postgres>,
  slug: string,
): Promise<ProjectBySlugRow | null> {
  if (!/^[a-z0-9][-a-z0-9]{0,62}[a-z0-9]$/i.test(slug)) return null;
  const rows = await sql<ProjectBySlugRow[]>`
    SELECT id::text AS id,
           client_id::text AS client_id,
           slug,
           name,
           notion_url,
           sanity_dataset,
           dashboard_project_key,
           client_website_url,
           created_at::text AS created_at
    FROM projects
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export type AllowlistSnapshot = {
  ready: boolean;
  emails: string[];
  admin_email: string | null;
  stakeholders: StakeholderInput[];
};

export async function getAllowlistForProject(
  sql: ReturnType<typeof postgres>,
  projectId: string,
): Promise<AllowlistSnapshot> {
  const sub = await getLatestSubmissionForProject(sql, projectId);
  if (!sub) {
    return { ready: false, emails: [], admin_email: null, stakeholders: [] };
  }
  const set = new Set<string>();
  if (sub.admin_email) set.add(normalize(sub.admin_email));
  for (const s of sub.stakeholders) {
    if (typeof s.email === "string" && s.email.trim().length > 0) {
      set.add(normalize(s.email));
    }
  }
  return {
    ready: true,
    emails: [...set],
    admin_email: sub.admin_email,
    stakeholders: sub.stakeholders,
  };
}

export type AllowlistCheck =
  | { allowed: true; projectId: string; project: ProjectBySlugRow }
  | { allowed: false; reason: "project_not_found" | "not_ready" | "forbidden" };

export async function isEmailAllowedForProject(
  sql: ReturnType<typeof postgres>,
  slug: string,
  email: string,
): Promise<AllowlistCheck> {
  const project = await getProjectBySlug(sql, slug);
  if (!project) return { allowed: false, reason: "project_not_found" };
  const allow = await getAllowlistForProject(sql, project.id);
  if (!allow.ready) {
    return { allowed: false, reason: "not_ready" };
  }
  if (!allow.emails.includes(normalize(email))) {
    return { allowed: false, reason: "forbidden" };
  }
  return { allowed: true, projectId: project.id, project };
}

/**
 * Projects whose latest onboarding submission lists this email as admin or
 * stakeholder (same roster as {@link getAllowlistForProject}).
 */
export async function listPortalProjectsForEmail(
  sql: ReturnType<typeof postgres>,
  email: string,
): Promise<{ slug: string; name: string }[]> {
  const norm = normalize(email);
  if (!norm.includes("@")) return [];

  const rows = await sql<{ slug: string; name: string }[]>`
    WITH latest AS (
      SELECT DISTINCT ON (i.project_id)
        p.slug,
        p.name,
        LOWER(TRIM(s.admin_email)) AS admin_norm,
        s.stakeholders
      FROM onboarding_submissions s
      JOIN onboarding_invites i ON i.id = s.invite_id
      JOIN projects p ON p.id = i.project_id
      ORDER BY i.project_id, s.submitted_at DESC
    )
    SELECT slug, name
    FROM latest
    WHERE admin_norm = ${norm}
       OR EXISTS (
         SELECT 1
         FROM jsonb_array_elements(COALESCE(stakeholders, '[]'::jsonb)) AS elem
         WHERE elem ? 'email'
           AND LOWER(TRIM(elem->>'email')) = ${norm}
       )
  `;
  return rows;
}
