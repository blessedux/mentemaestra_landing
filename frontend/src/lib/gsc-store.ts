import "server-only";

import type postgres from "postgres";

import { decryptToken, encryptToken } from "./gsc-token-crypt";

export type GscCredentialRow = {
  id: string;
  project_id: string;
  property_url: string;
  /** Decrypted refresh token — never serialized to the client. */
  refresh_token: string;
  scope: string | null;
  connected_email: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
};

/** Shape returned to the internal UI (no token). */
export type GscCredentialStatus = {
  connected: true;
  id: string;
  property_url: string;
  connected_email: string | null;
  connected_at: string;
} | { connected: false };

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the latest active (non-revoked) credential for a project,
 * with the refresh token decrypted.
 */
export async function getGscCredential(
  sql: ReturnType<typeof postgres>,
  projectId: string,
): Promise<GscCredentialRow | null> {
  const rows = await sql<
    {
      id: string;
      project_id: string;
      property_url: string;
      refresh_token_enc: string;
      scope: string | null;
      connected_email: string | null;
      created_at: string;
      updated_at: string;
      revoked_at: string | null;
    }[]
  >`
    SELECT id::text AS id,
           project_id::text AS project_id,
           property_url,
           refresh_token AS refresh_token_enc,
           scope,
           connected_email,
           created_at::text AS created_at,
           updated_at::text AS updated_at,
           revoked_at::text AS revoked_at
    FROM project_gsc_credentials
    WHERE project_id = ${projectId}::uuid
      AND revoked_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;

  let refresh_token: string;
  try {
    refresh_token = await decryptToken(row.refresh_token_enc);
  } catch {
    console.error("[gsc-store] failed to decrypt refresh token", projectId);
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    property_url: row.property_url,
    refresh_token,
    scope: row.scope,
    connected_email: row.connected_email,
    created_at: row.created_at,
    updated_at: row.updated_at,
    revoked_at: row.revoked_at,
  };
}

/**
 * Returns connection status for the internal panel (no token exposed).
 */
export async function getGscStatus(
  sql: ReturnType<typeof postgres>,
  projectId: string,
): Promise<GscCredentialStatus> {
  const rows = await sql<
    {
      id: string;
      property_url: string;
      connected_email: string | null;
      created_at: string;
    }[]
  >`
    SELECT id::text AS id,
           property_url,
           connected_email,
           created_at::text AS created_at
    FROM project_gsc_credentials
    WHERE project_id = ${projectId}::uuid
      AND revoked_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { connected: false };
  return {
    connected: true,
    id: row.id,
    property_url: row.property_url,
    connected_email: row.connected_email,
    connected_at: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type UpsertGscCredentialInput = {
  projectId: string;
  propertyUrl: string;
  refreshToken: string;
  scope?: string | null;
  connectedEmail?: string | null;
};

/**
 * Revokes any existing active credential and inserts a new one.
 */
export async function upsertGscCredential(
  sql: ReturnType<typeof postgres>,
  input: UpsertGscCredentialInput,
): Promise<GscCredentialRow> {
  const encryptedToken = await encryptToken(input.refreshToken);

  return sql.begin(async (tx) => {
    // Revoke any existing active credentials for this project.
    await tx`
      UPDATE project_gsc_credentials
      SET revoked_at = now()
      WHERE project_id = ${input.projectId}::uuid
        AND revoked_at IS NULL
    `;

    const rows = await tx<
      {
        id: string;
        project_id: string;
        property_url: string;
        refresh_token: string;
        scope: string | null;
        connected_email: string | null;
        created_at: string;
        updated_at: string;
        revoked_at: string | null;
      }[]
    >`
      INSERT INTO project_gsc_credentials
        (project_id, property_url, refresh_token, scope, connected_email)
      VALUES (
        ${input.projectId}::uuid,
        ${input.propertyUrl},
        ${encryptedToken},
        ${input.scope ?? null},
        ${input.connectedEmail ?? null}
      )
      RETURNING id::text AS id,
                project_id::text AS project_id,
                property_url,
                refresh_token,
                scope,
                connected_email,
                created_at::text AS created_at,
                updated_at::text AS updated_at,
                revoked_at::text AS revoked_at
    `;
    const row = rows[0];
    return {
      ...row,
      // Return the plaintext refresh token to the caller.
      refresh_token: input.refreshToken,
    };
  });
}

/**
 * Soft-deletes (marks revoked) the active credential for a project.
 * Returns true if a row was affected.
 */
export async function revokeGscCredential(
  sql: ReturnType<typeof postgres>,
  projectId: string,
): Promise<boolean> {
  const result = await sql`
    UPDATE project_gsc_credentials
    SET revoked_at = now(), updated_at = now()
    WHERE project_id = ${projectId}::uuid
      AND revoked_at IS NULL
  `;
  return result.count > 0;
}

/**
 * Updates only the property_url for the latest active credential
 * (used in the property-selection step after OAuth).
 */
export async function updateGscProperty(
  sql: ReturnType<typeof postgres>,
  credentialId: string,
  propertyUrl: string,
): Promise<boolean> {
  const result = await sql`
    UPDATE project_gsc_credentials
    SET property_url = ${propertyUrl},
        updated_at   = now()
    WHERE id = ${credentialId}::uuid
      AND revoked_at IS NULL
  `;
  return result.count > 0;
}
