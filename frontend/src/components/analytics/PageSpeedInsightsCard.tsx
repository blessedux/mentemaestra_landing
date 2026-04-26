"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type {
  PageSpeedCategoryBundle,
  PageSpeedCategoryId,
  PageSpeedInsightsBundle,
  PageSpeedStrategyResult,
} from "@/lib/pagespeed-insights";

type Props = {
  data: PageSpeedInsightsBundle;
  slug: string;
};

type StrategyKey = "mobile" | "desktop";

const PREVIEW_HEIGHT =
  "h-[min(40dvh,450px)] min-h-[130px] max-h-[min(43dvh,460px)]";

const CATEGORY_ORDER: PageSpeedCategoryId[] = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];

const CATEGORY_LABEL: Record<PageSpeedCategoryId, string> = {
  performance: "Rendimiento",
  accessibility: "Accesibilidad",
  "best-practices": "Buenas prácticas",
  seo: "SEO técnico",
};

const FOOTER_TITLE: Record<PageSpeedCategoryId, string> = {
  performance: "Pasos para mejorar el rendimiento",
  accessibility: "Pasos para mejorar la accesibilidad",
  "best-practices": "Pasos para mejorar buenas prácticas",
  seo: "Pasos para mejorar el SEO técnico",
};

const FOOTER_NOTE: Record<PageSpeedCategoryId, string> = {
  performance:
    "El rendimiento impacta retención y conversiones: prioriza LCP, bloqueos de render y peso de JS.",
  accessibility:
    "La accesibilidad mejora el uso para todos y reduce riesgo legal; corrige contraste, foco y etiquetas.",
  "best-practices":
    "Buenas prácticas cubren seguridad del navegador, APIs obsoletas y errores en consola.",
  seo:
    "El SEO técnico ayuda a que Google rastree e indexe bien: metadatos, enlaces y datos estructurados.",
};

function scoreColor(v: number | null): string {
  if (v == null) return "text-zinc-500";
  if (v >= 90) return "text-emerald-400";
  if (v >= 50) return "text-amber-300";
  return "text-red-400";
}

function categoryScore(
  active: PageSpeedStrategyResult,
  id: PageSpeedCategoryId,
): number | null {
  switch (id) {
    case "performance":
      return active.performance;
    case "accessibility":
      return active.accessibility;
    case "best-practices":
      return active.bestPractices;
    case "seo":
      return active.seo;
    default:
      return null;
  }
}

function fallbackBundle(): PageSpeedCategoryBundle {
  return {
    bullets: ["Aún no hay detalle de auditoría para esta categoría."],
    actions: ["Vuelve a ejecutar PageSpeed o revisa el sitio manualmente."],
  };
}

function detailsFor(
  active: PageSpeedStrategyResult | null | undefined,
): Record<PageSpeedCategoryId, PageSpeedCategoryBundle> {
  const out = {} as Record<PageSpeedCategoryId, PageSpeedCategoryBundle>;
  for (const id of CATEGORY_ORDER) {
    const raw = active?.details?.[id];
    out[id] =
      raw && (raw.bullets.length > 0 || raw.actions.length > 0)
        ? raw
        : fallbackBundle();
  }
  return out;
}

function PanelChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScoreRowExpandable({
  label,
  value,
  expanded,
  onToggle,
}: {
  label: string;
  value: number | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const v = value ?? null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`flex w-full items-baseline justify-between gap-3 border-b border-zinc-800/80 py-2.5 pl-2.5 text-left transition first:rounded-t-lg last:rounded-b-lg last:border-b-0 ${
        expanded
          ? "border-l-2 border-l-zinc-400 bg-zinc-800/35 hover:bg-zinc-800/45"
          : "border-l-2 border-l-transparent hover:bg-zinc-900/40"
      }`}
    >
      <span className="min-w-0 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <span
        className={`mr-2 shrink-0 text-2xl font-semibold tabular-nums sm:mr-3 sm:text-3xl ${scoreColor(v)}`}
      >
        {v == null ? "—" : v}
      </span>
    </button>
  );
}

export default function PageSpeedInsightsCard({ data, slug }: Props) {
  const [strategy, setStrategy] = useState<StrategyKey>(() =>
    data.mobile ? "mobile" : "desktop",
  );
  const [desktopLocal, setDesktopLocal] = useState<PageSpeedStrategyResult | null>(
    null,
  );
  const [desktopLoading, setDesktopLoading] = useState(false);
  const [desktopError, setDesktopError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<PageSpeedCategoryId | null>(
    "performance",
  );
  /** Full informe + pasos accionables (collapsed by default to save height). */
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);

  const mobile = data.mobile;
  const desktop = desktopLocal ?? data.desktop;
  const active = strategy === "mobile" ? mobile : desktop;
  const previewSrc = active?.screenshotDataUrl ?? null;
  const previewBusy = strategy === "desktop" && desktopLoading && !desktop;

  const detailMap = useMemo(() => detailsFor(active), [active]);

  useEffect(() => {
    setBottomPanelOpen(false);
  }, [strategy, expandedCategory]);

  const auditedUrl = data.auditedUrl;
  const visitHref =
    /^https?:\/\//i.test(auditedUrl) ? auditedUrl : `https://${auditedUrl}`;

  const loadDesktop = useCallback(async () => {
    if (desktopLocal ?? data.desktop) return;
    if (desktopLoading) return;
    setDesktopError(null);
    setDesktopLoading(true);
    try {
      const res = await fetch(
        `/api/client/${encodeURIComponent(slug)}/pagespeed?strategy=DESKTOP`,
        { method: "GET", cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as {
        result?: PageSpeedStrategyResult | null;
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        setDesktopError(
          json.error === "pagespeed_not_configured"
            ? "PageSpeed no está configurado."
            : json.error === "no_site_url"
              ? "Falta la URL del sitio en el proyecto."
              : "No se pudo ejecutar el análisis.",
        );
        return;
      }
      if (json.result) {
        setDesktopLocal(json.result);
        return;
      }
      const hint = json.hint?.trim();
      setDesktopError(
        hint
          ? `Lighthouse no devolvió resultado en escritorio. ${hint}`
          : "Lighthouse no pudo cargar la página en escritorio. Puedes reintentar.",
      );
    } catch {
      setDesktopError("Error de red. Reintenta en unos segundos.");
    } finally {
      setDesktopLoading(false);
    }
  }, [data.desktop, desktopLocal, desktopLoading, slug]);

  const selectDesktop = useCallback(() => {
    setStrategy("desktop");
    void loadDesktop();
  }, [loadDesktop]);

  const toggleCategory = useCallback((id: PageSpeedCategoryId) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
  }, []);

  if (!mobile && !desktop) {
    return (
      <p className="text-sm text-zinc-500">
        No pudimos obtener PageSpeed en este momento. Revisa que la API key
        tenga habilitada PageSpeed Insights y que la URL del sitio sea pública.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          PageSpeed Insights
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p
            className="max-w-[min(100%,14rem)] truncate text-[10px] text-zinc-600"
            title={auditedUrl}
          >
            {auditedUrl}
          </p>
          <a
            href={visitHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-800/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            Visitar sitio
          </a>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Toca cada puntuación para abrir el panel inferior; usa el botón con
        flecha para ver el informe completo y los pasos accionables. Escritorio
        se carga al elegirlo (hasta ~2 min).
      </p>

      <div
        className="flex w-full rounded-lg border border-zinc-800 bg-zinc-900/40 p-0.5"
        role="tablist"
        aria-label="Dispositivo"
      >
        <TabButton
          id="psi-mobile"
          selected={strategy === "mobile"}
          onClick={() => setStrategy("mobile")}
          disabled={!mobile}
          stretch
        >
          Móvil
        </TabButton>
        <TabButton
          id="psi-desktop"
          selected={strategy === "desktop"}
          onClick={selectDesktop}
          stretch
        >
          Escritorio
        </TabButton>
      </div>

      <div className="flex min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <div
          className={`relative min-h-0 w-full shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 lg:max-w-[min(22rem,48%)] xl:max-w-[min(24rem,44%)] ${PREVIEW_HEIGHT}`}
        >
          {previewBusy ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900/80 p-6 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
              <p className="text-xs text-zinc-500">
                Ejecutando Lighthouse en escritorio…
              </p>
            </div>
          ) : previewSrc ? (
            <div
              className={`flex h-full w-full items-start justify-center overflow-hidden ${
                strategy === "mobile" ? "bg-zinc-950 px-4 py-2 sm:px-8" : "bg-zinc-950"
              }`}
            >
              <div
                className={
                  strategy === "mobile"
                    ? "h-full max-h-full w-[min(176px,26vw)] shrink-0 overflow-hidden rounded-lg border border-zinc-700/70 bg-zinc-900/90 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]"
                    : "h-full w-full"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from Lighthouse */}
                <img
                  src={previewSrc}
                  alt={`Vista previa ${strategy === "mobile" ? "móvil" : "escritorio"}`}
                  className={
                    strategy === "mobile"
                      ? "h-full w-full object-cover object-top"
                      : "h-full w-full object-contain object-top"
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-zinc-500">
              Sin vista previa para este dispositivo.
            </div>
          )}
        </div>

        <aside className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 self-start lg:min-w-[12rem]">
          {active ? (
            <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/30">
              {CATEGORY_ORDER.map((id) => (
                <ScoreRowExpandable
                  key={id}
                  label={CATEGORY_LABEL[id]}
                  value={categoryScore(active, id)}
                  expanded={expandedCategory === id}
                  onToggle={() => toggleCategory(id)}
                />
              ))}
            </div>
          ) : strategy === "desktop" && desktopLoading ? null : (
            <p className="text-xs text-zinc-500">
              No hay puntuaciones para este dispositivo.
            </p>
          )}

          {strategy === "desktop" && desktopError && !desktop ? (
            <div className="rounded-lg border border-amber-900/35 bg-amber-950/15 px-3 py-2.5 text-[11px] text-amber-100/90">
              <p>{desktopError}</p>
              <button
                type="button"
                onClick={() => void loadDesktop()}
                disabled={desktopLoading}
                className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-amber-300 underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40"
              >
                Reintentar escritorio
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {active && expandedCategory ? (
        <div
          key={`${strategy}-${expandedCategory}`}
          className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 transition-[max-height] duration-200"
        >
          <div className="px-3 pb-1 pt-3 sm:px-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Informe — {CATEGORY_LABEL[expandedCategory]}
            </p>
            <div
              className={`relative text-[11px] leading-relaxed text-zinc-300 transition-[max-height] duration-200 ease-out motion-reduce:transition-none ${
                bottomPanelOpen ? "max-h-[min(70vh,28rem)]" : "max-h-[4.25rem]"
              } overflow-hidden`}
            >
              <ul className="list-inside list-disc space-y-1.5">
                {detailMap[expandedCategory].bullets.map((line: string, i: number) => (
                  <li key={i} className="pl-0.5 marker:text-zinc-600">
                    {line}
                  </li>
                ))}
              </ul>
              {!bottomPanelOpen ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900/95 to-transparent"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>

          <div className="border-t border-zinc-800/80 px-3 pb-1 pt-2 sm:px-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {FOOTER_TITLE[expandedCategory]}
            </p>
            <p
              className={`mb-2 text-[11px] leading-relaxed text-zinc-500 transition-[max-height] duration-200 motion-reduce:transition-none ${
                bottomPanelOpen ? "" : "line-clamp-2"
              }`}
            >
              {FOOTER_NOTE[expandedCategory]}
            </p>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
              Acciones sugeridas
            </p>
            <div
              className={`transition-[max-height] duration-200 ease-out motion-reduce:transition-none ${
                bottomPanelOpen ? "max-h-[min(60vh,24rem)]" : "max-h-0"
              } overflow-hidden`}
            >
              <ol className="list-inside list-decimal space-y-2 pb-1 text-[11px] leading-relaxed text-zinc-200">
                {detailMap[expandedCategory].actions.map((line: string, i: number) => (
                  <li key={i} className="marker:font-medium marker:text-zinc-500">
                    {line}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBottomPanelOpen((o) => !o)}
            aria-expanded={bottomPanelOpen}
            className="flex w-full items-center justify-center gap-2 border-t border-zinc-800/90 bg-zinc-950/50 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400 transition hover:bg-zinc-900/60 hover:text-zinc-200"
          >
            <PanelChevron expanded={bottomPanelOpen} />
            {bottomPanelOpen ? "Contraer informe y pasos" : "Ver informe y pasos completos"}
          </button>
        </div>
      ) : active ? (
        <div
          key={`${strategy}-summary`}
          className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-3 py-3 text-[11px] text-zinc-500 sm:px-4"
        >
          Elige una métrica arriba (Rendimiento, Accesibilidad…) para ver el informe
          y los pasos sugeridos.
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  id,
  selected,
  onClick,
  disabled,
  stretch,
  children,
}: {
  id: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** Full-width segment next to a narrower preview (Móvil / Escritorio). */
  stretch?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md text-[11px] font-medium uppercase tracking-[0.08em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        stretch
          ? "flex min-h-[2.75rem] flex-1 basis-0 items-center justify-center px-2 py-2.5 sm:px-4"
          : "px-3 py-1.5"
      } ${
        selected
          ? "bg-zinc-800 text-zinc-100 shadow-sm"
          : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
