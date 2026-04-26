import "server-only";

import { unstable_cache } from "next/cache";
import { generateObject } from "ai";
import { z } from "zod";

import type { GscDashboardData } from "./gsc-client";
import type { VercelAnalyticsDashboardData } from "./vercel-analytics-client";
import { getAnalyticsModel } from "./analytics-llm";
import { MASTER_PROMPT } from "./prompts/analytics/master";
import { SEO_SKILL } from "./prompts/analytics/seo-skill";
import { MARKETING_SKILL } from "./prompts/analytics/marketing-skill";

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const SeoPrioritySchema = z.object({
  action: z.string().describe("Acción concreta, máx 15 palabras"),
  target: z.string().describe("Página o consulta específica, máx 8 palabras"),
  impact: z.enum(["alto", "medio", "bajo"]),
  effort: z.enum(["alto", "medio", "bajo"]),
});

const MarketingIdeaSchema = z.object({
  channel: z.string().describe("Canal en 1-2 palabras: orgánico/paid/email/social"),
  idea: z.string().describe("Idea concreta, máx 20 palabras"),
  dataAnchor: z.string().describe("Dato del reporte que justifica esto, máx 10 palabras"),
});

export const AnalyticsStrategySchema = z.object({
  seoPriorities: z
    .array(SeoPrioritySchema)
    .min(1)
    .max(3)
    .describe("Las 1–3 prioridades SEO más accionables"),
  marketingIdeas: z
    .array(MarketingIdeaSchema)
    .min(1)
    .max(3)
    .describe("Las 1–3 ideas de marketing/campaña más concretas"),
  brief: z
    .string()
    .describe("2 oraciones naturales de introducción. Sin markdown. Máx 40 palabras."),
});

export type SeoPriority = z.infer<typeof SeoPrioritySchema>;
export type MarketingIdea = z.infer<typeof MarketingIdeaSchema>;
export type AnalyticsStrategy = z.infer<typeof AnalyticsStrategySchema>;

export type AnalyticsStrategyResult = {
  strategy: AnalyticsStrategy;
  generatedAt: string;
  model: string;
};

// ---------------------------------------------------------------------------
// Data summarizers (keep prompts short / bounded)
// ---------------------------------------------------------------------------

function buildGscSummary(data: GscDashboardData): string {
  const { overview, topQueries, topPages, dateRange } = data;

  const queriesText = topQueries
    .slice(0, 8)
    .map(
      (q, i) =>
        `${i + 1}. "${q.query}" — ${q.clicks} clics, ${q.impressions} imp, CTR ${(q.ctr * 100).toFixed(1)}%, pos ${q.position.toFixed(1)}`,
    )
    .join("\n");

  const pagesText = topPages
    .slice(0, 5)
    .map(
      (p, i) =>
        `${i + 1}. ${p.page} — ${p.clicks} clics, pos ${p.position.toFixed(1)}`,
    )
    .join("\n");

  return `\
=== GOOGLE SEARCH CONSOLE (${dateRange.start} → ${dateRange.end}) ===
Total clics: ${overview.totalClicks} | Impresiones: ${overview.totalImpressions} | CTR promedio: ${(overview.avgCtr * 100).toFixed(2)}% | Posición promedio: ${overview.avgPosition.toFixed(1)}

Top consultas de búsqueda:
${queriesText}

Top páginas:
${pagesText}`;
}

function buildVercelSummary(data: VercelAnalyticsDashboardData): string {
  const {
    overview,
    topPages,
    topReferrers,
    topCountries,
    topCities,
    topRegions,
    devices,
    dateRange,
  } = data;

  const pagesText = topPages
    .slice(0, 5)
    .map((p, i) => `${i + 1}. ${p.path} — ${p.total} vistas`)
    .join("\n");

  const referrersText = topReferrers
    .slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.referrer || "directo"} — ${r.total}`)
    .join("\n");

  const countriesText = topCountries
    .slice(0, 3)
    .map((c) => `${c.country}: ${c.total}`)
    .join(", ");

  const citiesText =
    topCities.length > 0
      ? topCities
          .slice(0, 5)
          .map((c) => `${c.city}: ${c.total}`)
          .join(", ")
      : "n/d";

  const regionsText =
    topRegions.length > 0
      ? topRegions
          .slice(0, 5)
          .map((c) => `${c.region}: ${c.total}`)
          .join(", ")
      : "n/d";

  const devicesText = devices
    .map((d) => `${d.device}: ${d.total}`)
    .join(", ");

  const bounce =
    overview.bounceRate !== null
      ? `${(overview.bounceRate * 100).toFixed(1)}%`
      : "n/d";
  const duration =
    overview.avgDurationSec !== null
      ? `${overview.avgDurationSec.toFixed(0)}s`
      : "n/d";

  return `\
=== TRÁFICO DEL SITIO (${dateRange.start} → ${dateRange.end}) ===
Visitantes: ${overview.visitors} | Pageviews: ${overview.pageviews} | Rebote: ${bounce} | Duración media: ${duration}
Países: ${countriesText}
Ciudades (si hay): ${citiesText}
Regiones (si hay): ${regionsText}
Dispositivos: ${devicesText}

Páginas más vistas:
${pagesText}

Fuentes de tráfico:
${referrersText}`;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

async function generateStrategy(
  gscSummary: string,
  vercelSummary: string | null,
): Promise<AnalyticsStrategyResult> {
  const systemPrompt = [MASTER_PROMPT, SEO_SKILL, MARKETING_SKILL].join(
    "\n\n",
  );

  const dataSections = [gscSummary, vercelSummary]
    .filter(Boolean)
    .join("\n\n");

  const model = getAnalyticsModel();

  const { object, response } = await generateObject({
    model,
    schema: AnalyticsStrategySchema,
    system: systemPrompt,
    prompt: `Analiza los siguientes datos de rendimiento y genera la estrategia:\n\n${dataSections}`,
    temperature: 0.35,
    maxOutputTokens: 2500,
    maxRetries: 0,
  });

  return {
    strategy: object,
    generatedAt: new Date().toISOString(),
    model: response.modelId ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// Cached public API (refreshes once per UTC day per project)
// ---------------------------------------------------------------------------

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

const _cachedGenerate = unstable_cache(
  async (
    _projectId: string,
    _date: string,
    gscSummary: string,
    vercelSummary: string | null,
  ) => generateStrategy(gscSummary, vercelSummary),
  ["analytics-strategy"],
  { revalidate: 86400 },
);

export function getCachedAnalyticsStrategy(
  projectId: string,
  gscData: GscDashboardData,
  vercelData: VercelAnalyticsDashboardData | null,
): Promise<AnalyticsStrategyResult> {
  const gscSummary = buildGscSummary(gscData);
  const vercelSummary = vercelData ? buildVercelSummary(vercelData) : null;
  return _cachedGenerate(projectId, todayUtc(), gscSummary, vercelSummary);
}
