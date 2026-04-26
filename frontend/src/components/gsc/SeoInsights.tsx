import { getCachedSeoInsights, type SeoInsight } from "@/lib/seo-insights";
import type { GscDashboardData } from "@/lib/gsc-client";

type Props = {
  projectId: string;
  gscData: GscDashboardData;
};

const typeConfig: Record<
  SeoInsight["type"],
  { label: string; dot: string; border: string; bg: string; text: string }
> = {
  win: {
    label: "Logro",
    dot: "bg-emerald-400",
    border: "border-emerald-900/40",
    bg: "bg-emerald-950/20",
    text: "text-emerald-100",
  },
  opportunity: {
    label: "Oportunidad",
    dot: "bg-[#c9a07a]",
    border: "border-[#c9a07a]/25",
    bg: "bg-[#3d2b1a]/20",
    text: "text-zinc-100",
  },
  warning: {
    label: "Atención",
    dot: "bg-amber-400",
    border: "border-amber-900/40",
    bg: "bg-amber-950/20",
    text: "text-amber-100",
  },
};

/**
 * Async Server Component — streams separately via Suspense.
 * Calls OpenAI gpt-4o-mini and caches results for 24 hours per project.
 */
export default async function SeoInsights({ projectId, gscData }: Props) {
  let result;
  try {
    result = await getCachedSeoInsights(projectId, gscData);
  } catch (err) {
    console.error("[SeoInsights] failed to generate insights", err);
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 text-sm text-zinc-500">
        No pudimos generar recomendaciones en este momento. Intenta recargar.
      </div>
    );
  }

  if (!result.insights.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 text-sm text-zinc-500">
        No hay suficientes datos de búsqueda para generar recomendaciones aún.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-zinc-600">
        Generado con IA · {new Date(result.generatedAt).toLocaleDateString("es-CL")}
      </p>
      <ul className="space-y-3">
        {result.insights.map((insight, i) => {
          const cfg = typeConfig[insight.type] ?? typeConfig.opportunity;
          return (
            <li
              key={i}
              className={`flex gap-3 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
              />
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${cfg.text}`}>
                  {insight.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                  {insight.detail}
                </p>
              </div>
              <span className="ml-auto shrink-0 self-start rounded-full border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                {cfg.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Skeleton shown while the LLM insight streams in. */
export function SeoInsightsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
        >
          <div className="mb-2 h-3.5 w-48 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-full animate-pulse rounded bg-zinc-800/60" />
          <div className="mt-1.5 h-3 w-3/4 animate-pulse rounded bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}
