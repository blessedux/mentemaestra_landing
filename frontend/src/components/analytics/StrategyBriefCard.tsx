"use client";

import { useEffect, useState } from "react";
import TypewriterText, { TypewriterUpdate } from "./TypewriterText";
import SuggestionChatModal from "./SuggestionChatModal";
import type { AnalyticsStrategy, SeoPriority, MarketingIdea } from "@/lib/analytics-strategy";
import type { ChatContext } from "@/app/api/client/[slug]/analytics-chat/route";
import { sanitizeRevisedActionTitle } from "@/lib/revised-action-sanitize";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SuggestionRef =
  | { type: "seo"; idx: number; item: SeoPriority }
  | { type: "marketing"; idx: number; item: MarketingIdea };

type Props = {
  strategy: AnalyticsStrategy;
  generatedAt: string;
  analysisId: string | null;
  slug: string;
  /** OpenRouter is active — show the strategist model selector in chat. */
  showOpenRouterModelPicker?: boolean;
};

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const IMPACT_COLOR: Record<string, string> = {
  alto: "text-emerald-400",
  medio: "text-[#c9a07a]",
  bajo: "text-zinc-500",
};

const EFFORT_COLOR: Record<string, string> = {
  alto: "text-red-400",
  medio: "text-amber-400",
  bajo: "text-emerald-400",
};

function titleDiffersFromOriginal(original: string, rev: string): boolean {
  return (
    original.trim().localeCompare(rev.trim(), "es", {
      sensitivity: "accent",
    }) !== 0
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StrategyBriefCard({
  strategy,
  generatedAt,
  analysisId,
  slug,
  showOpenRouterModelPicker = false,
}: Props) {
  const [active, setActive] = useState<SuggestionRef | null>(null);
  const [revisions, setRevisions] = useState<Record<string, string>>({});

  // Restore titles already saved in DB (e.g. after refresh or revisiting the page).
  useEffect(() => {
    if (!analysisId) return;
    const analysisIdForHydrate = analysisId;
    let cancelled = false;

    async function loadPersistedRevisions() {
      const next: Record<string, string> = {};

      async function fetchOne(
        type: "seo" | "marketing",
        idx: number,
        original: string | undefined,
      ) {
        const params = new URLSearchParams({
          analysisId: analysisIdForHydrate,
          type,
          idx: String(idx),
        });
        const res = await fetch(`/api/client/${slug}/analytics-chat?${params}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as ChatContext;
        const rev = sanitizeRevisedActionTitle(data.revisedAction);
        if (!rev) return;
        if (original?.trim() && !titleDiffersFromOriginal(original, rev)) return;
        next[`${type}-${idx}`] = rev;
      }

      await Promise.all([
        ...strategy.seoPriorities.map((p, i) =>
          fetchOne("seo", i, p.action),
        ),
        ...strategy.marketingIdeas.map((m, i) =>
          fetchOne("marketing", i, m.idea),
        ),
      ]);

      if (cancelled) return;
      if (Object.keys(next).length > 0) {
        setRevisions((prev) => ({ ...prev, ...next }));
      }
    }

    void loadPersistedRevisions();
    return () => {
      cancelled = true;
    };
  }, [analysisId, slug, strategy]);

  function handleClose(type: "seo" | "marketing", idx: number) {
    setActive(null);
    if (!analysisId) return;
    const analysisIdForPoll = analysisId;

    const original =
      type === "seo"
        ? strategy.seoPriorities[idx]?.action?.trim()
        : strategy.marketingIdeas[idx]?.idea?.trim();

    async function pollRevision() {
      try {
        const params = new URLSearchParams({
          analysisId: analysisIdForPoll,
          type,
          idx: String(idx),
        });
        const res = await fetch(`/api/client/${slug}/analytics-chat?${params}`);
        const data = (await res.json()) as ChatContext;
        const rev = sanitizeRevisedActionTitle(data.revisedAction);
        if (!rev) return;
        if (original && !titleDiffersFromOriginal(original, rev)) return;
        setRevisions((prev) => ({
          ...prev,
          [`${type}-${idx}`]: rev,
        }));
      } catch {
        // silent — revision stays as original
      }
    }

    setTimeout(() => void pollRevision(), 5500);
    setTimeout(() => void pollRevision(), 13000);
  }

  return (
    <>
      <p className="mb-6 text-sm leading-relaxed text-zinc-400">
        <TypewriterText text={strategy.brief} speedMs={16} />
      </p>

      {strategy.seoPriorities.length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            Prioridades SEO
          </p>
          <ul className="space-y-2.5">
            {strategy.seoPriorities.map((p, i) => {
              const revision = revisions[`seo-${i}`];
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() =>
                      setActive({ type: "seo", idx: i, item: p })
                    }
                    className="group w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-zinc-200">
                        <TypewriterUpdate
                          text={p.action}
                          nextText={revision}
                          speedDeleteMs={36}
                          speedTypeMs={13}
                        />
                      </p>
                      <span className="shrink-0 translate-x-0 text-[10px] text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400">
                        →
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{p.target}</p>
                    <div className="mt-2 flex gap-3 text-[11px]">
                      <span>
                        Impacto:{" "}
                        <span className={`font-semibold ${IMPACT_COLOR[p.impact] ?? "text-zinc-400"}`}>
                          {p.impact}
                        </span>
                      </span>
                      <span>
                        Esfuerzo:{" "}
                        <span className={`font-semibold ${EFFORT_COLOR[p.effort] ?? "text-zinc-400"}`}>
                          {p.effort}
                        </span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {strategy.marketingIdeas.length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            Ideas de marketing
          </p>
          <ul className="space-y-2.5">
            {strategy.marketingIdeas.map((m, i) => {
              const revision = revisions[`marketing-${i}`];
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() =>
                      setActive({ type: "marketing", idx: i, item: m })
                    }
                    className="group w-full rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="mb-1.5 inline-block rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-zinc-400">
                          {m.channel}
                        </span>
                        <p className="text-sm text-zinc-200">
                          <TypewriterUpdate
                            text={m.idea}
                            nextText={revision}
                            speedDeleteMs={36}
                            speedTypeMs={13}
                          />
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          <span className="text-zinc-600">Dato base: </span>
                          {m.dataAnchor}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400">
                        →
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-zinc-700">
        {new Date(generatedAt).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}{" "}
        · Se actualiza diariamente · Haz clic en cualquier sugerencia para hablar con el estratega
      </p>

      {active && (
        <SuggestionChatModal
          slug={slug}
          analysisId={analysisId}
          suggestionType={active.type}
          suggestionIdx={active.idx}
          suggestion={active.item}
          strategyBrief={strategy.brief}
          showOpenRouterModelPicker={showOpenRouterModelPicker}
          onClose={() => handleClose(active.type, active.idx)}
        />
      )}
    </>
  );
}

/** Shown inside Suspense while the RSC resolves. */
export function StrategyBriefSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3.5 w-full animate-pulse rounded bg-zinc-800" />
      <div className="h-3.5 w-5/6 animate-pulse rounded bg-zinc-800" />
      <div className="mt-2 space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
          >
            <div className="mb-2 h-3.5 w-3/4 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
