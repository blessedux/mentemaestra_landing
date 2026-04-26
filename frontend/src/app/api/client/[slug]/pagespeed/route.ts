import { getDb, hasDatabase } from "@/lib/db";
import { getAllowlistForProject, getProjectBySlug } from "@/lib/client-allowlist";
import {
  fetchPageSpeedStrategyWithHint,
  isPageSpeedInsightsConfigured,
} from "@/lib/pagespeed-insights";
import { readPortalSession } from "@/lib/portal-access";

type RouteParams = { params: Promise<{ slug: string }> };

/** Lighthouse desktop runs can exceed default serverless limits. */
export const maxDuration = 120;

/** Per-attempt timeouts are applied inside fetchPageSpeedStrategyWithHint. */

/**
 * GET — run PageSpeed Insights for one strategy (MOBILE | DESKTOP).
 * Requires portal session + allowlisted email for the slug’s project.
 */
export async function GET(req: Request, { params }: RouteParams) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  const session = await readPortalSession();
  if (!session || session.slug !== slug) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return Response.json({ error: "no_database" }, { status: 503 });
  }

  if (!isPageSpeedInsightsConfigured()) {
    return Response.json({ error: "pagespeed_not_configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("strategy")?.toUpperCase() ?? "MOBILE";
  const strategy = raw === "DESKTOP" ? "DESKTOP" : raw === "MOBILE" ? "MOBILE" : null;
  if (!strategy) {
    return Response.json({ error: "invalid_strategy" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return Response.json({ error: "no_database" }, { status: 503 });
  }

  const project = await getProjectBySlug(sql, slug);
  if (!project) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const allow = await getAllowlistForProject(sql, project.id);
  if (!allow.ready || !allow.emails.includes(session.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const siteUrl = project.client_website_url?.trim() ?? "";
  if (!siteUrl) {
    return Response.json({ error: "no_site_url" }, { status: 400 });
  }

  const { result, hint } = await fetchPageSpeedStrategyWithHint(siteUrl, strategy, {
    cache: "no-store",
  });

  return Response.json({ result, strategy, hint: result ? undefined : hint });
}
