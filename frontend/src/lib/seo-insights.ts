import "server-only";

import { generateObject } from "ai";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { getAnalyticsModel } from "./analytics-llm";
import type { GscDashboardData } from "./gsc-client";

export type SeoInsight = {
  type: "opportunity" | "warning" | "win";
  title: string;
  detail: string;
};

export type SeoInsightsResult = {
  insights: SeoInsight[];
  generatedAt: string;
  model: string;
};

const SeoInsightSchema = z.object({
  type: z.enum(["opportunity", "warning", "win"]),
  title: z.string(),
  detail: z.string(),
});

const SeoInsightsObjectSchema = z.object({
  insights: z.array(SeoInsightSchema).min(1).max(5),
});

const SYSTEM_SEO_INSIGHTS = `Eres un experto en SEO analítico. Analiza los datos de Google Search Console que recibirás y entrega entre 3 y 5 insights accionables y concretos en español.

Reglas de contenido de cada insight:
- "win": algo que está funcionando bien
- "opportunity": algo que puede mejorar con acción concreta
- "warning": algo que está bajando o necesita atención urgente
- "title": máximo 8 palabras
- "detail": 1-2 oraciones, específico; cita números o consultas del análisis
- No repitas obviedades genéricas`;

/**
 * Today's date string (UTC) — used as part of the cache key so insights
 * refresh once per day automatically.
 */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Builds a compact summary of GSC data to send to the LLM.
 * Keeps the prompt short to minimize token usage.
 */
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

  return `
Período: ${dateRange.start} a ${dateRange.end}
Total clics: ${overview.totalClicks}
Total impresiones: ${overview.totalImpressions}
CTR promedio: ${(overview.avgCtr * 100).toFixed(2)}%
Posición promedio: ${overview.avgPosition.toFixed(1)}

Top consultas:
${queriesText}

Top páginas:
${pagesText}
`.trim();
}

async function generateInsights(
  gscSummary: string,
): Promise<SeoInsightsResult> {
  const { object, response } = await generateObject({
    model: getAnalyticsModel(),
    schema: SeoInsightsObjectSchema,
    system: SYSTEM_SEO_INSIGHTS,
    prompt: `Datos de Search Console:\n\n${gscSummary}`,
    temperature: 0.4,
    maxOutputTokens: 800,
    maxRetries: 0,
  });

  return {
    insights: object.insights,
    generatedAt: new Date().toISOString(),
    model: response.modelId ?? "unknown",
  };
}

/**
 * Module-level cached function (required by unstable_cache — must not be
 * called inside a dynamic scope). projectId + date form the effective key;
 * gscSummary is also an arg so the cache auto-invalidates when data changes.
 */
const _cachedGenerate = unstable_cache(
  async (
    _projectId: string,
    _date: string,
    gscSummary: string,
  ): Promise<SeoInsightsResult> => generateInsights(gscSummary),
  ["gsc-seo-insights"],
  { revalidate: 86400 },
);

/**
 * Returns cached LLM SEO insights for a project (refreshes once per UTC day).
 */
export function getCachedSeoInsights(
  projectId: string,
  gscData: GscDashboardData,
): Promise<SeoInsightsResult> {
  return _cachedGenerate(projectId, todayUtc(), buildGscSummary(gscData));
}
