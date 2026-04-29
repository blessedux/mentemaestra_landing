/**
 * Scheduled SEO report emails (Resend) for projects with GSC connected.
 *
 * Schedule is defined in `vercel.json` (daily UTC). This handler only sends on
 * calendar days 1 and 15 in `America/Santiago`; other days return `{ skipped: true }`.
 *
 * Vercel: set `CRON_SECRET` in the project env; Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 */
import { getDb, hasDatabase } from "@/lib/db";
import { fetchGscDashboardData } from "@/lib/gsc-client";
import { getCachedAnalyticsStrategy } from "@/lib/analytics-strategy";
import { renderAnalyticsReportEmailEs } from "@/lib/analytics-report-email";
import { insertAnalyticsReport } from "@/lib/analytics-reports-store";
import { getOnboardingPublicBaseUrl, getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { postResendEmail } from "@/lib/resend-post";

export const dynamic = "force-dynamic";

type ProjectSendTarget = {
  project_id: string;
  project_name: string;
  slug: string;
  admin_email: string | null;
  client_website_url: string | null;
  gsc_property: string;
  gsc_refresh_token: string;
  vercel_project_id: string | null;
};

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
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

function getChileDayOfMonth(now = new Date()): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      day: "2-digit",
    }).formatToParts(now);
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const n = Number.parseInt(day, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function isSendDay(now = new Date()): boolean {
  // Use Chile time so "1st/15th" matches local expectations.
  const day = getChileDayOfMonth(now) ?? now.getUTCDate();
  return day === 1 || day === 15;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  /**
   * Vercel Cron auth (recommended):
   * - Set `CRON_SECRET` in Vercel Project → Settings → Environment Variables
   * - Vercel will call the route with `Authorization: Bearer <CRON_SECRET>`
   *
   * We also support:
   * - `CRON_REPORTS_SECRET` + `x-cron-secret` header (useful for manual curls / non-Vercel schedulers)
   */
  const vercelCronSecret = process.env.CRON_SECRET?.trim();
  const legacyHeaderSecret = process.env.CRON_REPORTS_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!vercelCronSecret && !legacyHeaderSecret) {
      return new Response("CRON_SECRET (or CRON_REPORTS_SECRET) is not set", {
        status: 503,
      });
    }
  }

  if (vercelCronSecret) {
    const auth = req.headers.get("authorization")?.trim() ?? "";
    const expected = `Bearer ${vercelCronSecret}`;
    if (auth !== expected) return new Response("Unauthorized", { status: 401 });
  } else if (legacyHeaderSecret) {
    const got = req.headers.get("x-cron-secret")?.trim();
    if (got !== legacyHeaderSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Should be unreachable due to the env gate above, but keep it explicit.
    return new Response("Unauthorized", { status: 401 });
  }

  const force = url.searchParams.get("force") === "1";
  if (!isSendDay() && !(force && process.env.NODE_ENV !== "production")) {
    return Response.json({ ok: true, skipped: true, reason: "not_send_day" });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !resendFrom) {
    return Response.json({ ok: false, error: "resend_not_configured" }, { status: 503 });
  }

  if (!hasDatabase()) return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  const sql = getDb();
  if (!sql) return Response.json({ ok: false, error: "no_database" }, { status: 503 });

  const targets = await sql<ProjectSendTarget[]>`
    WITH latest AS (
      SELECT DISTINCT ON (i.project_id)
        i.project_id,
        s.admin_email
      FROM onboarding_submissions s
      JOIN onboarding_invites i ON i.id = s.invite_id
      ORDER BY i.project_id, s.submitted_at DESC
    )
    SELECT p.id::text AS project_id,
           p.name AS project_name,
           p.slug AS slug,
           latest.admin_email AS admin_email,
           p.client_website_url AS client_website_url,
           g.property_url AS gsc_property,
           g.refresh_token AS gsc_refresh_token,
           p.vercel_project_id::text AS vercel_project_id
    FROM projects p
    JOIN project_gsc_credentials g
      ON g.project_id = p.id
     AND g.revoked_at IS NULL
    LEFT JOIN latest
      ON latest.project_id = p.id
  `;

  const base = getOnboardingPublicBaseUrl().replace(/\/$/, "");
  const supportEmail = getOnboardingSupportEmail();
  const { start, end } = resolvePeriod();

  let attempted = 0;
  let sent = 0;
  let skippedNoEmail = 0;
  let skippedDuplicate = 0;

  for (const t of targets) {
    const to = (t.admin_email ?? "").trim().toLowerCase();
    if (!to || !to.includes("@")) {
      skippedNoEmail++;
      continue;
    }

    attempted++;

    const portalUrl = `${base}/client/${encodeURIComponent(t.slug)}`;
    const analyticsUrl = `${portalUrl}/gsc`;

    const gscData = await withTimeout(
      fetchGscDashboardData(t.gsc_refresh_token, t.gsc_property).catch(() => null),
      25_000,
    );
    if (!gscData) continue;

    // Strategy only needs GSC + optional vercel; we skip Vercel here to keep the cron fast/stable.
    const strategy = await withTimeout(
      getCachedAnalyticsStrategy(t.project_id, gscData, null).catch(() => null),
      12_000,
    );
    if (!strategy) continue;

    const subject = `Reporte SEO — ${t.project_name} (${start} → ${end})`;
    const html = renderAnalyticsReportEmailEs({
      projectName: t.project_name,
      supportEmail,
      analyticsUrl,
      portalUrl,
      clientWebsiteUrl: (t.client_website_url ?? "").trim(),
      gscProperty: t.gsc_property,
      gscData,
      strategy,
    });

    const ok = await postResendEmail(resendKey, "[cron/analytics-report]", {
      from: resendFrom,
      to: [to],
      subject,
      html,
      text: `Reporte SEO — ${t.project_name}\n\nVer Analytics: ${analyticsUrl}\nSoporte: ${supportEmail}`,
    });
    if (!ok) continue;

    const row = await insertAnalyticsReport(sql, {
      projectId: t.project_id,
      sentTo: to,
      sentBy: "cron",
      subject,
      dateStart: start,
      dateEnd: end,
      htmlBody: html,
    }).catch(() => null);

    if (!row) {
      skippedDuplicate++;
      continue;
    }

    sent++;
  }

  return Response.json({
    ok: true,
    attempted,
    sent,
    skippedNoEmail,
    skippedDuplicate,
    period: { start, end },
  });
}

