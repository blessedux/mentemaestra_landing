/**
 * HTTP Basic Auth helpers for the internal CRM (see src/middleware.ts).
 *
 * Pure, edge-runtime safe: no Node APIs. All comparisons are constant-time
 * against the expected user/password so timing does not leak which field
 * is wrong.
 */

export type ParsedBasicAuth = { user: string; pass: string };

/** Decode base64 in both Node and Edge (atob is a global in both). */
function decodeBase64(b64: string): string | null {
  try {
    const bin = atob(b64);
    // atob yields binary-latin1; decode to UTF-8 to support non-ASCII creds.
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}

/** Returns `{ user, pass }` for a well-formed `Authorization: Basic ...` header, else null. */
export function parseBasicAuthHeader(
  header: string | null | undefined,
): ParsedBasicAuth | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ", 2);
  if (!scheme || !value) return null;
  if (scheme.toLowerCase() !== "basic") return null;
  const decoded = decodeBase64(value.trim());
  if (decoded === null) return null;
  const idx = decoded.indexOf(":");
  if (idx < 0) return null;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  return { user, pass };
}

/** Constant-time string compare that avoids early-exit on length mismatch. */
export function timingSafeEqualString(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    const ac = i < aBytes.length ? aBytes[i] : 0;
    const bc = i < bBytes.length ? bBytes[i] : 0;
    diff |= ac ^ bc;
  }
  return diff === 0;
}

export function verifyBasicAuth(
  header: string | null | undefined,
  expected: { user: string; pass: string },
): boolean {
  const parsed = parseBasicAuthHeader(header);
  if (!parsed) return false;
  const userOk = timingSafeEqualString(parsed.user, expected.user);
  const passOk = timingSafeEqualString(parsed.pass, expected.pass);
  return userOk && passOk;
}

export const BASIC_AUTH_REALM = "Mentemaestra CRM";

export const BASIC_AUTH_CHALLENGE_HEADER = `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`;
