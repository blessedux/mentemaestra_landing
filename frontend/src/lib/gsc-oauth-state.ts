import "server-only";

/**
 * HMAC-signed OAuth state parameter for the GSC connect flow.
 *
 * State format (base64url): `<projectId>.<timestamp>.<hmac>`
 * - projectId: UUID of the project being connected
 * - timestamp: Unix seconds (used to expire state after 10 minutes)
 * - hmac: SHA-256 HMAC of "<projectId>.<timestamp>" using PORTAL_SESSION_SECRET
 *
 * We reuse the existing PORTAL_SESSION_SECRET to avoid requiring a separate
 * env var. The secret is already required for the portal to function at all.
 */

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret(): string {
  const s = process.env.PORTAL_SESSION_SECRET?.trim() ?? "";
  if (!s) throw new Error("PORTAL_SESSION_SECRET is not set");
  return s;
}

async function hmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function buildOAuthState(projectId: string): Promise<string> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${projectId}.${ts}`;
  const sig = await hmac(payload, getSecret());
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export type ParsedOAuthState = { projectId: string } | null;

export async function parseOAuthState(raw: string): Promise<ParsedOAuthState> {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length < 3) return null;

    // Last part is signature; UUID has hyphens so parts[0] = UUID, parts[1] = ts, rest = sig
    const sig = parts[parts.length - 1];
    const ts = parts[parts.length - 2];
    const projectId = parts.slice(0, parts.length - 2).join(".");

    const payload = `${projectId}.${ts}`;
    const expected = await hmac(payload, getSecret());
    if (expected !== sig) return null;

    const age = Date.now() - parseInt(ts, 10) * 1000;
    if (age > STATE_TTL_MS || age < -5000) return null;

    return { projectId };
  } catch {
    return null;
  }
}
