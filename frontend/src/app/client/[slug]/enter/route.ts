import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import { isEmailAllowedForProject } from "@/lib/client-allowlist";
import { canonicalOriginFromRequest } from "@/lib/public-site-url";
import {
  applyPortalSessionCookie,
  verifyAccessToken,
} from "@/lib/portal-access";

export const dynamic = "force-dynamic";

/**
 * Redeems the HMAC-signed `?token=` from a welcome-email link:
 *
 *   1. Verify signature + expiry.
 *   2. Confirm the token's `slug` matches the URL slug.
 *   3. Re-check the live allowlist (so removed members can't sneak back in
 *      with an old link).
 *   4. Drop a signed session cookie and redirect to the bare portal URL
 *      (scrubbing `token=` from the address bar).
 *
 * Any failure redirects to `/client/<slug>/login?reason=<code>` so the
 * recipient sees a friendly explanation instead of a blank JSON error.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) return reject(req, slug, "missing_token");

  const claims = verifyAccessToken(token);
  if (!claims) return reject(req, slug, "invalid_token");
  if (claims.slug !== slug) return reject(req, slug, "slug_mismatch");

  if (!hasDatabase()) return reject(req, slug, "unavailable");
  const sql = getDb();
  if (!sql) return reject(req, slug, "unavailable");

  const check = await isEmailAllowedForProject(sql, slug, claims.email);
  if (!check.allowed) {
    const reason =
      check.reason === "project_not_found"
        ? "not_found"
        : check.reason === "not_ready"
          ? "not_ready"
          : "forbidden";
    return reject(req, slug, reason);
  }

  // Session cookie must be set on this `NextResponse` so `Set-Cookie` ships with
  // the 302 (App Router can omit cookies set only via `cookies().set()` on redirects).
  // Use a stable browser origin (never `0.0.0.0`) so the cookie applies on the next GET.
  const origin = canonicalOriginFromRequest(req);
  const destination = new URL(`/client/${encodeURIComponent(slug)}`, origin);
  const res = NextResponse.redirect(destination);
  applyPortalSessionCookie(res, slug, claims.email);
  return res;
}

function reject(req: Request, slug: string, reason: string): NextResponse {
  const origin = canonicalOriginFromRequest(req);
  const dest = new URL(`/client/${encodeURIComponent(slug)}/login`, origin);
  dest.searchParams.set("reason", reason);
  return NextResponse.redirect(dest);
}
