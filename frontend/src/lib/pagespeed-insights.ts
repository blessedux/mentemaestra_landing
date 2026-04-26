import "server-only";

/** Lighthouse category ids as returned by the PSI / Lighthouse JSON. */
export type PageSpeedCategoryId =
  | "performance"
  | "accessibility"
  | "best-practices"
  | "seo";

export type PageSpeedCategoryBundle = {
  /** Short lines for the expanded “report” panel. */
  bullets: string[];
  /** Action-oriented lines for the card footer. */
  actions: string[];
};

/** Lighthouse category scores + screenshot + per-category bullets/actions. */
export type PageSpeedStrategyResult = {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  analyzedAt: string | null;
  screenshotDataUrl: string | null;
  /** Present on new runs; older cached payloads may omit this. */
  details?: Record<PageSpeedCategoryId, PageSpeedCategoryBundle>;
};

export type PageSpeedInsightsBundle = {
  auditedUrl: string;
  mobile: PageSpeedStrategyResult | null;
  desktop: PageSpeedStrategyResult | null;
};

const CATEGORY_IDS: PageSpeedCategoryId[] = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];

function apiKey(): string | null {
  return (
    process.env.GOOGLE_PAGESPEED_API_KEY?.trim() ||
    process.env.PAGESPEED_INSIGHTS_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    null
  );
}

export function isPageSpeedInsightsConfigured(): boolean {
  return Boolean(apiKey());
}

function normalizeSiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function score01To100(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  const n = v <= 1 ? Math.round(v * 100) : Math.round(v);
  return Math.max(0, Math.min(100, n));
}

type LhAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  details?: { type?: string; overallSavingsMs?: number; data?: unknown };
};

type AuditRef = { id: string; weight?: number };

type CategoryBlock = {
  score?: number | null;
  auditRefs?: AuditRef[];
};

type LighthouseJson = {
  lighthouseResult?: {
    fetchTime?: string;
    categories?: Record<string, CategoryBlock | undefined>;
    audits?: Record<string, LhAudit | undefined>;
  };
  error?: { code?: number; message?: string };
  id?: string;
};

function emptyDetails(): Record<PageSpeedCategoryId, PageSpeedCategoryBundle> {
  const empty = (): PageSpeedCategoryBundle => ({ bullets: [], actions: [] });
  return {
    performance: empty(),
    accessibility: empty(),
    "best-practices": empty(),
    seo: empty(),
  };
}

function isCountedFailure(audit: LhAudit | undefined): audit is LhAudit {
  if (!audit) return false;
  const mode = audit.scoreDisplayMode;
  if (
    mode === "informative" ||
    mode === "manual" ||
    mode === "notApplicable" ||
    mode === "error"
  ) {
    return false;
  }
  if (audit.score === null || audit.score === undefined) return false;
  return audit.score < 1;
}

function lineForBullet(audit: LhAudit): string {
  const title = audit.title?.trim() || audit.id || "Audit";
  const dv = audit.displayValue?.trim();
  if (dv && dv.length <= 56 && !dv.includes("\n")) return `${title} — ${dv}`;
  return title;
}

function lineForAction(audit: LhAudit): string {
  const title = audit.title?.trim() || audit.id || "este punto";
  return `Aborda: ${title}.`;
}

function parseCategoryBundle(
  catId: PageSpeedCategoryId,
  audits: Record<string, LhAudit | undefined>,
  category: CategoryBlock | undefined,
): PageSpeedCategoryBundle {
  const refs = category?.auditRefs ?? [];
  const weighted = refs
    .filter((r) => (r.weight ?? 0) > 0)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

  const failed: LhAudit[] = [];
  for (const ref of weighted) {
    const a = audits[ref.id];
    if (isCountedFailure(a)) failed.push(a);
  }

  const unique: LhAudit[] = [];
  const seen = new Set<string>();
  for (const a of failed) {
    const key = a.id || a.title || "";
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(a);
  }

  const bullets =
    unique.length > 0
      ? unique.slice(0, 12).map(lineForBullet)
      : [
          "No se listaron incumplimientos ponderados en esta categoría para esta corrida.",
        ];

  const actions =
    unique.length > 0
      ? unique.slice(0, 8).map(lineForAction)
      : [
          "Sin alertas críticas automáticas aquí; conviene revisar manualmente tras cambios mayores.",
        ];

  return { bullets, actions };
}

function parseStrategyResult(json: LighthouseJson): PageSpeedStrategyResult {
  const lr = json.lighthouseResult;
  const cat = lr?.categories;
  const audits = lr?.audits ?? {};
  const raw = audits["final-screenshot"]?.details?.data;
  const screenshotDataUrl =
    typeof raw === "string" && raw.startsWith("data:image") ? raw : null;

  const analyzedAt =
    lr?.fetchTime ?? (typeof json.id === "string" ? json.id : null);

  const details = emptyDetails();
  for (const id of CATEGORY_IDS) {
    details[id] = parseCategoryBundle(id, audits, cat?.[id]);
  }

  return {
    performance: score01To100(cat?.performance?.score ?? null),
    accessibility: score01To100(cat?.accessibility?.score ?? null),
    bestPractices: score01To100(cat?.["best-practices"]?.score ?? null),
    seo: score01To100(cat?.seo?.score ?? null),
    analyzedAt,
    screenshotDataUrl,
    details,
  };
}

const DEFAULT_PSI_CATEGORIES = [
  "PERFORMANCE",
  "ACCESSIBILITY",
  "BEST_PRACTICES",
  "SEO",
] as const;

/** Google often returns this for PSI-side or page-specific Lighthouse crashes (not your API key). */
function isGenericLighthouseFailure(snippet: string | undefined): boolean {
  if (!snippet) return false;
  return /Something went wrong|lighthouseError|PAGE_HUNG|INTERNAL_ERROR/i.test(snippet);
}

async function fetchPageSpeedOnce(
  auditedUrl: string,
  key: string,
  strategy: "MOBILE" | "DESKTOP",
  init?: RequestInit,
  categories: readonly string[] = DEFAULT_PSI_CATEGORIES,
): Promise<{ result: PageSpeedStrategyResult | null; apiSnippet?: string }> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", auditedUrl);
  endpoint.searchParams.set("key", key);
  endpoint.searchParams.set("strategy", strategy);
  for (const c of categories) {
    endpoint.searchParams.append("category", c);
  }

  try {
    const res = await fetch(endpoint.toString(), init);
    const bodyText = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("[pagespeed] API error", strategy, res.status, bodyText.slice(0, 400));
      return { result: null, apiSnippet: bodyText.slice(0, 280) };
    }
    let json: LighthouseJson;
    try {
      json = JSON.parse(bodyText) as LighthouseJson;
    } catch {
      return { result: null, apiSnippet: bodyText.slice(0, 200) };
    }
    if (json.error?.message) {
      console.error("[pagespeed] PSI payload error", strategy, json.error.message);
      return { result: null, apiSnippet: json.error.message };
    }
    return { result: parseStrategyResult(json) };
  } catch (err) {
    console.error("[pagespeed] fetch failed", strategy, err);
    return { result: null, apiSnippet: err instanceof Error ? err.message : String(err) };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Run PageSpeed for a single strategy with optional retries (desktop).
 * Returns a hint string when all attempts fail (for UI / logs).
 */
const MOBILE_SINGLE_TIMEOUT_MS = 85_000;
/** Per attempt; 2 attempts + backoff must stay under typical 120s route budget. */
const DESKTOP_ATTEMPT_TIMEOUT_MS = 52_000;

export async function fetchPageSpeedStrategyWithHint(
  siteUrl: string,
  strategy: "MOBILE" | "DESKTOP",
  init?: RequestInit,
): Promise<{ result: PageSpeedStrategyResult | null; hint?: string }> {
  const key = apiKey();
  const url = normalizeSiteUrl(siteUrl);
  if (!key || !url) return { result: null, hint: "missing_key_or_url" };

  const attempts = strategy === "DESKTOP" ? 2 : 2;
  const perAttemptMs =
    strategy === "DESKTOP" ? DESKTOP_ATTEMPT_TIMEOUT_MS : MOBILE_SINGLE_TIMEOUT_MS;

  let lastSnippet: string | undefined;
  for (let i = 0; i < attempts; i++) {
    const merged: RequestInit = {
      ...init,
      signal: AbortSignal.timeout(perAttemptMs),
    };
    const { result, apiSnippet } = await fetchPageSpeedOnce(url, key, strategy, merged);
    lastSnippet = apiSnippet;
    if (!result && apiSnippet && isGenericLighthouseFailure(apiSnippet)) {
      const degraded = await fetchPageSpeedOnce(url, key, strategy, merged, [
        "PERFORMANCE",
      ]);
      if (degraded.result) return { result: degraded.result };
      lastSnippet = degraded.apiSnippet ?? apiSnippet;
    }
    if (result) return { result };
    if (i < attempts - 1) await sleep(4000);
  }
  if (lastSnippet) {
    console.error(
      "[pagespeed] failed after attempts",
      strategy,
      url.slice(0, 96),
      lastSnippet.slice(0, 220),
    );
  }
  const hint =
    lastSnippet && isGenericLighthouseFailure(lastSnippet)
      ? "Lighthouse en Google devolvió un error genérico (falla frecuente del servicio PSI o la página no se pudo auditar). Prueba en https://pagespeed.web.dev/ o más tarde; si allí también falla, el sitio o el entorno de Google lo bloquean."
      : lastSnippet && /PAGE_HUNG|hung|timeout/i.test(lastSnippet)
        ? "Lighthouse devolvió PAGE_HUNG o timeout. Reintenta o prueba en pagespeed.web.dev."
        : lastSnippet?.slice(0, 180);
  return { result: null, hint };
}

export async function fetchPageSpeedStrategy(
  siteUrl: string,
  strategy: "MOBILE" | "DESKTOP",
  init?: RequestInit,
): Promise<PageSpeedStrategyResult | null> {
  const { result } = await fetchPageSpeedStrategyWithHint(siteUrl, strategy, init);
  return result;
}

export async function fetchPageSpeedInsightsBundle(
  siteUrl: string,
): Promise<PageSpeedInsightsBundle | null> {
  const key = apiKey();
  const url = normalizeSiteUrl(siteUrl);
  if (!key || !url) return null;

  const mobile = await fetchPageSpeedStrategy(url, "MOBILE", {
    next: { revalidate: 3600 },
  });

  return { auditedUrl: url, mobile, desktop: null };
}
