import "server-only";

/**
 * Vercel Web Analytics data client.
 *
 * Setup:
 *   1. vercel.com → Account Settings → Tokens → Create token (scope: all projects or specific)
 *   2. Set VERCEL_API_TOKEN in .env.local (one shared read token for all projects).
 *   3. Optionally set VERCEL_TEAM_ID if your projects live under a Vercel team.
 *   4. Store each client's Vercel project ID in `projects.vercel_project_id` in the DB
 *      (set it in the CRM → project detail panel). Pass it to `fetchVercelAnalyticsDashboard`.
 *
 * The data API is an internal Vercel endpoint — it may change. We handle
 * errors gracefully so the portal still renders if analytics are unavailable.
 */

const BASE = "https://vercel.com/api";

/** True only if the shared API token is configured. */
export function isVercelAnalyticsConfigured(vercelProjectId?: string | null): boolean {
  return Boolean(
    process.env.VERCEL_API_TOKEN?.trim() && vercelProjectId?.trim(),
  );
}

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function msAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export type VercelAnalyticsOverview = {
  visitors: number;
  pageviews: number;
  bounceRate: number | null;
  avgDurationSec: number | null;
};

export type VercelPageStat = {
  path: string;
  total: number;
};

export type VercelReferrerStat = {
  referrer: string;
  total: number;
};

export type VercelCountryStat = {
  country: string;
  total: number;
};

export type VercelCityStat = {
  city: string;
  total: number;
};

export type VercelRegionStat = {
  region: string;
  total: number;
};

export type VercelDeviceStat = {
  device: string;
  total: number;
};

export type VercelAnalyticsDashboardData = {
  overview: VercelAnalyticsOverview;
  topPages: VercelPageStat[];
  topReferrers: VercelReferrerStat[];
  topCountries: VercelCountryStat[];
  /** City names when Vercel returns them (often coarse; not barrio-level). */
  topCities: VercelCityStat[];
  /** Region/state codes when available. */
  topRegions: VercelRegionStat[];
  devices: VercelDeviceStat[];
  dateRange: { start: string; end: string };
};

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function vercelGet<T>(
  projectId: string,
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const teamId = process.env.VERCEL_TEAM_ID?.trim();

  const qs = new URLSearchParams({
    projectId,
    ...(teamId ? { teamId } : {}),
    environment: "production",
    ...params,
  });

  try {
    const res = await fetch(`${BASE}${path}?${qs}`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // IMPORTANT: this module runs in Server Components. `console.error` here
      // is surfaced as a hard error overlay in dev (intercept-console-error),
      // which can "break" navigation to /gsc even though analytics is optional.
      // Treat 404s (endpoint/project not available) as a normal "no data" case.
      if (res.status === 404) return null;
      // Soft-log other failures without throwing.
      console.warn("[vercel-analytics] request failed", res.status, path, text);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn("[vercel-analytics] fetch threw", path, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches aggregated Vercel Web Analytics data for the last `daysBack` days.
 *
 * @param vercelProjectId - The client's Vercel project ID (stored per project in the DB).
 * @param daysBack - How many days of data to retrieve (default 28).
 * Returns null if not configured or the API call fails.
 */
export async function fetchVercelAnalyticsDashboard(
  vercelProjectId: string | null | undefined,
  daysBack = 28,
): Promise<VercelAnalyticsDashboardData | null> {
  if (!isVercelAnalyticsConfigured(vercelProjectId)) return null;
  const projectId = vercelProjectId!.trim();

  const from = msAgo(daysBack).toString();
  const to = Date.now().toString();
  const params = { from, to };

  // Vercel exposes insights at /web/insights — request overview + breakdowns in parallel.
  const [
    stats,
    pagesBreakdown,
    referrersBreakdown,
    countriesBreakdown,
    citiesBreakdown,
    regionsBreakdown,
    devicesBreakdown,
  ] = await Promise.all([
    vercelGet<{
      data?: {
        pageViews?: { value?: number };
        visitors?: { value?: number };
        bounceRate?: { value?: number };
        avgDuration?: { value?: number };
      };
      pageViews?: number;
      visitors?: number;
      bounceRate?: number;
      avgDuration?: number;
    }>(projectId, "/web/insights", params),
    vercelGet<{ data?: { key: string; total: number }[] }>(
      projectId,
      "/web/insights/breakdown",
      { ...params, key: "path" },
    ),
    vercelGet<{ data?: { key: string; total: number }[] }>(
      projectId,
      "/web/insights/breakdown",
      { ...params, key: "referrer" },
    ),
    vercelGet<{ data?: { key: string; total: number }[] }>(
      projectId,
      "/web/insights/breakdown",
      { ...params, key: "country" },
    ),
    vercelGet<{ data?: { key: string; total: number }[] }>(
      projectId,
      "/web/insights/breakdown",
      { ...params, key: "city" },
    ).catch(() => null),
    vercelGet<{ data?: { key: string; total: number }[] }>(
      projectId,
      "/web/insights/breakdown",
      { ...params, key: "region" },
    ).catch(() => null),
    vercelGet<{ data?: { key: string; total: number }[] }>(
      projectId,
      "/web/insights/breakdown",
      { ...params, key: "device" },
    ),
  ]);

  if (!stats) return null;

  // Normalize — Vercel's response shape can vary slightly between API versions.
  const pageviews =
    stats.data?.pageViews?.value ?? stats.pageViews ?? 0;
  const visitors =
    stats.data?.visitors?.value ?? stats.visitors ?? 0;
  const bounceRate =
    stats.data?.bounceRate?.value ?? stats.bounceRate ?? null;
  const avgDuration =
    stats.data?.avgDuration?.value ?? stats.avgDuration ?? null;

  const toList = (raw: { data?: { key: string; total: number }[] } | null) =>
    raw?.data ?? [];

  const startDate = new Date(msAgo(daysBack)).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  return {
    overview: {
      visitors,
      pageviews,
      bounceRate: typeof bounceRate === "number" ? bounceRate : null,
      avgDurationSec: typeof avgDuration === "number" ? avgDuration : null,
    },
    topPages: toList(pagesBreakdown)
      .slice(0, 10)
      .map((r) => ({ path: r.key, total: r.total })),
    topReferrers: toList(referrersBreakdown)
      .slice(0, 8)
      .map((r) => ({ referrer: r.key || "(directo)", total: r.total })),
    topCountries: toList(countriesBreakdown)
      .slice(0, 8)
      .map((r) => ({ country: r.key, total: r.total })),
    topCities: toList(citiesBreakdown)
      .filter((r) => r.key?.trim())
      .slice(0, 10)
      .map((r) => ({ city: r.key, total: r.total })),
    topRegions: toList(regionsBreakdown)
      .filter((r) => r.key?.trim())
      .slice(0, 10)
      .map((r) => ({ region: r.key, total: r.total })),
    devices: toList(devicesBreakdown).map((r) => ({
      device: r.key || "Unknown",
      total: r.total,
    })),
    dateRange: { start: startDate, end: endDate },
  };
}
