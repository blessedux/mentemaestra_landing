import { isOpenRouterApiConfigured } from "@/lib/analytics-llm";
import { getCachedAnalyticsStrategy } from "@/lib/analytics-strategy";
import { upsertStrategyAnalysis } from "@/lib/analytics-strategy-store";
import { getDb } from "@/lib/db";
import type { GscDashboardData } from "@/lib/gsc-client";
import type { VercelAnalyticsDashboardData } from "@/lib/vercel-analytics-client";
import StrategyBriefCard from "./StrategyBriefCard";

type Props = {
  projectId: string;
  slug: string;
  gscData: GscDashboardData;
  vercelData: VercelAnalyticsDashboardData | null;
};

/**
 * Async RSC — fetches daily-cached AI strategy, saves to DB, renders the brief card.
 * Wrap in <Suspense fallback={<StrategyBriefSkeleton />}> at the call site.
 */
export default async function AnalyticsStrategy({
  projectId,
  slug,
  gscData,
  vercelData,
}: Props) {
  let result;
  try {
    result = await getCachedAnalyticsStrategy(projectId, gscData, vercelData);
  } catch (err) {
    console.error("[AnalyticsStrategy] generation failed", err);
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-xs text-zinc-500">
        No pudimos generar la estrategia en este momento. Intenta recargar.
      </div>
    );
  }

  // Upsert analysis to DB (idempotent — ON CONFLICT DO UPDATE, returns stable UUID)
  let analysisId: string | null = null;
  const sql = getDb();
  if (sql) {
    const row = await upsertStrategyAnalysis(
      sql,
      projectId,
      result.strategy,
      result.model,
    ).catch((err) => {
      console.error("[AnalyticsStrategy] DB upsert failed", err);
      return null;
    });
    if (row) {
      analysisId = row.id;
    }
  }

  return (
    <StrategyBriefCard
      strategy={result.strategy}
      generatedAt={result.generatedAt}
      analysisId={analysisId}
      slug={slug}
      showOpenRouterModelPicker={isOpenRouterApiConfigured()}
    />
  );
}
