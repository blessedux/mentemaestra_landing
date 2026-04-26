import "server-only";

import { unstable_cache } from "next/cache";
import OpenAI from "openai";

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

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Eres un experto en SEO analítico. Analiza los datos de Google Search Console que recibirás y entrega entre 3 y 5 insights accionables y concretos en español. 

Responde ÚNICAMENTE con un JSON con esta estructura:
{
  "insights": [
    {
      "type": "opportunity" | "warning" | "win",
      "title": "Título corto (máx 8 palabras)",
      "detail": "Explicación concreta de qué hacer o qué está pasando (1-2 oraciones)"
    }
  ]
}

Reglas:
- "win": algo que está funcionando bien
- "opportunity": algo que puede mejorar con acción concreta
- "warning": algo que está bajando o necesita atención urgente
- Sé específico, cita números o consultas del análisis
- No repitas obviedades genéricas`,
      },
      {
        role: "user",
        content: `Datos de Search Console:\n\n${gscSummary}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { insights?: SeoInsight[] };
  try {
    parsed = JSON.parse(raw) as { insights?: SeoInsight[] };
  } catch {
    parsed = { insights: [] };
  }

  return {
    insights: parsed.insights ?? [],
    generatedAt: new Date().toISOString(),
    model: completion.model,
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
