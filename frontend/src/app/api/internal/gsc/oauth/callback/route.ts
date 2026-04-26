import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import {
  exchangeCodeForTokens,
  listGscSites,
} from "@/lib/gsc-client";
import { upsertGscCredential } from "@/lib/gsc-store";
import { parseOAuthState } from "@/lib/gsc-oauth-state";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/gsc/oauth/callback?code=…&state=…
 *
 * Google redirects here after the operator grants access. We:
 *   1. Validate the HMAC state (CSRF protection + recovers projectId).
 *   2. Exchange the code for tokens.
 *   3. Persist the encrypted refresh token.
 *   4. Redirect back to the internal project page with a `gsc_pending_property`
 *      query param containing the new credential ID, so the ProjectDetailPanel
 *      can open the "select property" modal pre-populated with sites.list results.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  function fail(reason: string, projectId?: string) {
    const base = projectId
      ? `/internal/projects/${encodeURIComponent(projectId)}`
      : "/internal";
    return NextResponse.redirect(
      new URL(`${base}?gsc_error=${encodeURIComponent(reason)}`, url),
    );
  }

  if (errorParam) return fail(errorParam);
  if (!state) return fail("missing_state");
  if (!code) return fail("missing_code");

  const parsed = await parseOAuthState(state);
  if (!parsed) return fail("invalid_state");

  const { projectId } = parsed;

  if (!hasDatabase()) return fail("database_not_configured", projectId);
  const sql = getDb();
  if (!sql) return fail("database_not_configured", projectId);

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("[gsc/oauth/callback] token exchange failed", err);
    return fail("token_exchange_failed", projectId);
  }

  if (!tokens.refresh_token) {
    return fail("no_refresh_token", projectId);
  }

  // Fetch connected Google account email for operator visibility.
  let connectedEmail: string | null = null;
  try {
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (userRes.ok) {
      const user = (await userRes.json()) as { email?: string };
      connectedEmail = user.email ?? null;
    }
  } catch {}

  // Fetch the list of accessible sites so they can be previewed in the modal.
  let sites: { siteUrl: string; permissionLevel: string }[] = [];
  try {
    sites = await listGscSites(tokens.access_token);
  } catch (err) {
    console.error("[gsc/oauth/callback] sites.list failed", err);
    // Non-fatal — property selection modal will just be empty.
  }

  // Use the first site as placeholder URL; operator selects the real one in the modal.
  const placeholderProperty = sites[0]?.siteUrl ?? "pending";

  let credential;
  try {
    credential = await upsertGscCredential(sql, {
      projectId,
      propertyUrl: placeholderProperty,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope ?? null,
      connectedEmail,
    });
  } catch (err) {
    console.error("[gsc/oauth/callback] upsert failed", err);
    return fail("save_failed", projectId);
  }

  // Redirect to internal project page with pending property selection context.
  const sitesEncoded = encodeURIComponent(JSON.stringify(sites));
  const dest = new URL(
    `/internal/projects/${encodeURIComponent(projectId)}` +
      `?gsc_pending_property=${encodeURIComponent(credential.id)}` +
      `&gsc_sites=${sitesEncoded}`,
    url,
  );
  return NextResponse.redirect(dest);
}
