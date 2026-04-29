import "server-only";

/**
 * Google Search Console API client.
 *
 * OAuth app setup (one-time):
 *   1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)
 *   2. Add authorized redirect URI: <ONBOARDING_PUBLIC_BASE_URL>/api/internal/gsc/oauth/callback
 *   3. Enable "Google Search Console API" in the project's APIs library.
 *   4. Set env vars: GSC_CLIENT_ID, GSC_CLIENT_SECRET.
 *      Optional: GSC_REDIRECT_URI (full URL to the callback route). If unset, we derive it from
 *      ONBOARDING_PUBLIC_BASE_URL (or its fallback) + `/api/internal/gsc/oauth/callback`.
 */

import { getOnboardingPublicBaseUrl } from "@/lib/onboarding-env";

const GSC_API_BASE = "https://www.googleapis.com";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

const GSC_FETCH_TIMEOUT_MS = 25_000;

/**
 * Unbounded `fetch` to Google can hang the portal `/gsc` RSC; always time out.
 */
function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = GSC_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(input, { ...init, signal: ctrl.signal })
    .finally(() => {
      clearTimeout(t);
    });
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

export function getGscClientId(): string | null {
  return process.env.GSC_CLIENT_ID?.trim() || null;
}

export function getGscClientSecret(): string | null {
  return process.env.GSC_CLIENT_SECRET?.trim() || null;
}

export function getGscRedirectUri(): string | null {
  const explicit = process.env.GSC_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getOnboardingPublicBaseUrl()}/api/internal/gsc/oauth/callback`;
}

export function isGscConfigured(): boolean {
  return Boolean(getGscClientId() && getGscClientSecret() && getGscRedirectUri());
}

// ---------------------------------------------------------------------------
// OAuth URL builder
// ---------------------------------------------------------------------------

export function buildGscAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGscClientId() ?? "",
    redirect_uri: getGscRedirectUri() ?? "",
    response_type: "code",
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    access_type: "offline",
    prompt: "consent",    // force refresh_token to always be returned
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

/**
 * Exchanges an authorization code for tokens (initial OAuth flow).
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const res = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGscClientId() ?? "",
      client_secret: getGscClientSecret() ?? "",
      redirect_uri: getGscRedirectUri() ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }
  return res.json() as Promise<TokenResponse>;
}

/**
 * Exchanges a refresh token for a fresh access token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getGscClientId() ?? "",
      client_secret: getGscClientSecret() ?? "",
      grant_type: "refresh_token",
    }),
    // Do not cache token exchanges
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Token refresh failed (${res.status}): ${err}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

/**
 * Revokes a token at Google (best-effort; called on disconnect).
 */
export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: "POST",
    cache: "no-store",
  }).catch(() => {
    // Ignore network errors — we always revoke locally regardless.
  });
}

// ---------------------------------------------------------------------------
// Sites (properties) list
// ---------------------------------------------------------------------------

export type GscSite = {
  siteUrl: string;
  permissionLevel: string;
};

/**
 * Lists all GSC properties accessible to the authorized Google account.
 */
export async function listGscSites(accessToken: string): Promise<GscSite[]> {
  const res = await fetchWithTimeout(
    `${GSC_API_BASE}/webmasters/v3/sites`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`sites.list failed (${res.status}): ${err}`);
  }
  const data = (await res.json()) as { siteEntry?: GscSite[] };
  return data.siteEntry ?? [];
}

// ---------------------------------------------------------------------------
// Search Analytics
// ---------------------------------------------------------------------------

export type SearchAnalyticsRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchAnalyticsResult = {
  rows: SearchAnalyticsRow[];
};

async function searchAnalyticsQuery(
  accessToken: string,
  propertyUrl: string,
  body: Record<string, unknown>,
): Promise<SearchAnalyticsResult> {
  const res = await fetchWithTimeout(
    `${GSC_API_BASE}/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`searchAnalytics.query failed (${res.status}): ${err}`);
  }
  const data = (await res.json()) as { rows?: SearchAnalyticsRow[] };
  return { rows: data.rows ?? [] };
}

/** ISO date string for a date N days ago (UTC). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Public API: all data fetched for the GSC dashboard
// ---------------------------------------------------------------------------

export type GscOverview = {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
};

export type GscTrendPoint = {
  date: string;
  clicks: number;
  impressions: number;
};

export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscPageRow = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscDashboardData = {
  overview: GscOverview;
  trend: GscTrendPoint[];
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
  dateRange: { start: string; end: string };
};

/**
 * Fetches all data needed for the GSC dashboard in parallel.
 * Uses a single access token obtained from the refresh token.
 */
export async function fetchGscDashboardData(
  refreshToken: string,
  propertyUrl: string,
  daysBack = 28,
): Promise<GscDashboardData> {
  const { access_token } = await refreshAccessToken(refreshToken);

  const startDate = daysAgo(daysBack);
  const endDate = daysAgo(1); // GSC usually has a 1-2 day lag

  const [overviewRes, trendRes, queriesRes, pagesRes] = await Promise.all([
    // Overview: no dimension = aggregate row
    searchAnalyticsQuery(access_token, propertyUrl, {
      startDate,
      endDate,
      rowLimit: 1,
    }),
    // Trend: date dimension for sparkline
    searchAnalyticsQuery(access_token, propertyUrl, {
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: daysBack,
    }),
    // Top queries
    searchAnalyticsQuery(access_token, propertyUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 10,
      orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
    }),
    // Top pages
    searchAnalyticsQuery(access_token, propertyUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 10,
      orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
    }),
  ]);

  const agg = overviewRes.rows[0];
  const overview: GscOverview = {
    totalClicks: agg?.clicks ?? 0,
    totalImpressions: agg?.impressions ?? 0,
    avgCtr: agg?.ctr ?? 0,
    avgPosition: agg?.position ?? 0,
  };

  const trend: GscTrendPoint[] = trendRes.rows.map((r) => ({
    date: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  const topQueries: GscQueryRow[] = queriesRes.rows.map((r) => ({
    query: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  const topPages: GscPageRow[] = pagesRes.rows.map((r) => ({
    page: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  return { overview, trend, topQueries, topPages, dateRange: { start: startDate, end: endDate } };
}
