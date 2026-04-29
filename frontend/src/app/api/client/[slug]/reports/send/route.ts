import { getDb, hasDatabase } from "@/lib/db";
import { getProjectBySlug, getAllowlistForProject } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { getGscCredential } from "@/lib/gsc-store";
import { fetchGscDashboardData } from "@/lib/gsc-client";
import {
  fetchVercelAnalyticsDashboard,
  isVercelAnalyticsConfigured,
} from "@/lib/vercel-analytics-client";
import { getCachedAnalyticsStrategy } from "@/lib/analytics-strategy";
import { renderAnalyticsReportEmailEs } from "@/lib/analytics-report-email";
import { insertAnalyticsReport } from "@/lib/analytics-reports-store";
import { getOnboardingSupportEmail, getOnboardingPublicBaseUrl } from "@/lib/onboarding-env";
import { postResendEmail } from "@/lib/resend-post";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let t: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => {
        t = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

function resolvePeriod(now = new Date()): { start: string; end: string } {
  // Default: last full 28 days (matches dashboard). This keeps the report stable
  // and independent of calendar month boundaries.
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

export async function POST(req: Request, { params }: Ctx) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  const session = await readPortalSession();
  if (!session || session.slug !== slug || session.admin !== true) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !resendFrom) {
    return Response.json({ ok: false, error: "resend_not_configured" }, { status: 503 });
  }

  if (!hasDatabase()) return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  const sql = getDb();
  if (!sql) return Response.json({ ok: false, error: "no_database" }, { status: 503 });

  const project = await getProjectBySlug(sql, slug);
  if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  const allow = await getAllowlistForProject(sql, project.id);
  const to = (allow.admin_email ?? "").trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return Response.json(
      { ok: false, error: "missing_admin_email" },
      { status: 409 },
    );
  }

  const cred = await getGscCredential(sql, project.id).catch(() => null);
  if (!cred) return Response.json({ ok: false, error: "gsc_not_connected" }, { status: 409 });

  const gscData = await fetchGscDashboardData(cred.refresh_token, cred.property_url).catch(() => null);
  if (!gscData) return Response.json({ ok: false, error: "gsc_fetch_failed" }, { status: 503 });

  const vercelData =
    isVercelAnalyticsConfigured(project.vercel_project_id)
      ? await withTimeout(fetchVercelAnalyticsDashboard(project.vercel_project_id!, 28).catch(() => null), 8_000)
      : null;

  const strategy = await getCachedAnalyticsStrategy(project.id, gscData, vercelData).catch(() => null);
  if (!strategy) return Response.json({ ok: false, error: "strategy_failed" }, { status: 503 });

  const base = getOnboardingPublicBaseUrl().replace(/\/$/, "");
  const analyticsUrl = `${base}/client/${encodeURIComponent(slug)}/gsc`;
  const portalUrl = `${base}/client/${encodeURIComponent(slug)}`;
  const supportEmail = getOnboardingSupportEmail();
  const { start, end } = resolvePeriod();

  const subject = `Reporte SEO — ${project.name} (${start} → ${end})`;
  const html = renderAnalyticsReportEmailEs({
    projectName: project.name,
    supportEmail,
    analyticsUrl,
    portalUrl,
    clientWebsiteUrl: project.client_website_url?.trim() ?? "",
    gscProperty: cred.property_url,
    gscData,
    strategy,
  });

  const sent = await postResendEmail(resendKey, "[analytics-report]", {
    from: resendFrom,
    to: [to],
    subject,
    html,
    text: `Reporte SEO — ${project.name}\n\nVer Analytics: ${analyticsUrl}\nSoporte: ${supportEmail}`,
  });

  if (!sent) return Response.json({ ok: false, error: "send_failed" }, { status: 502 });

  await insertAnalyticsReport(sql, {
    projectId: project.id,
    sentTo: to,
    sentBy: session.email,
    subject,
    dateStart: start,
    dateEnd: end,
    htmlBody: html,
  }).catch((err) => {
    console.error("[analytics-report] failed to persist history", err);
  });

  return Response.json({ ok: true, to, subject });
}

