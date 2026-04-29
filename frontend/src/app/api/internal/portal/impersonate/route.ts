import { NextResponse } from "next/server";

import { canonicalOriginFromRequest } from "@/lib/public-site-url";
import { getDb, hasDatabase } from "@/lib/db";
import { getProjectBySlug } from "@/lib/client-allowlist";
import { applyAdminPortalSessionCookie } from "@/lib/portal-access";

export const dynamic = "force-dynamic";

/**
 * Internal-only portal impersonation.
 *
 * Middleware gates `/api/internal/*` via Basic Auth, so this endpoint can mint an
 * admin portal session cookie for any client slug and redirect into the portal
 * without requiring a per-client magic link.
 *
 * GET /api/internal/portal/impersonate?slug=<slug>[&path=/gsc]
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  const rawPath = (url.searchParams.get("path") ?? "").trim();

  if (!slug) return Response.json({ ok: false, error: "missing_slug" }, { status: 400 });
  if (!/^[a-z0-9][-a-z0-9]{0,62}[a-z0-9]$/.test(slug)) {
    return Response.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  // Verify project exists so we don't mint sessions for junk slugs.
  if (!hasDatabase()) return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  const sql = getDb();
  if (!sql) return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  const project = await getProjectBySlug(sql, slug);
  if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  const safePath =
    rawPath.length === 0
      ? ""
      : rawPath.startsWith("/") && !rawPath.startsWith("//") && !rawPath.includes("://")
        ? rawPath
        : "";

  const origin = canonicalOriginFromRequest(req);
  const destination = new URL(
    `/client/${encodeURIComponent(slug)}${safePath}`,
    origin,
  );
  const res = NextResponse.redirect(destination);
  applyAdminPortalSessionCookie(res, slug);
  return res;
}

