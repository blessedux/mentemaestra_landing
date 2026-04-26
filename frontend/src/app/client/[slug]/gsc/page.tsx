import type React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import { getAllowlistForProject, getProjectBySlug } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { getGscCredential } from "@/lib/gsc-store";
import { fetchGscDashboardData } from "@/lib/gsc-client";
import PageSpeedInsightsCard from "@/components/analytics/PageSpeedInsightsCard";
import {
  fetchPageSpeedInsightsBundle,
  isPageSpeedInsightsConfigured,
} from "@/lib/pagespeed-insights";
import { fetchVercelAnalyticsDashboard, isVercelAnalyticsConfigured } from "@/lib/vercel-analytics-client";
import { isAnalyticsLlmConfigured } from "@/lib/analytics-llm";
import GscDashboard from "@/components/gsc/GscDashboard";
import VercelAnalyticsDashboard from "@/components/analytics/VercelAnalyticsDashboard";
import AnalyticsStrategy from "@/components/analytics/AnalyticsStrategy";
import { StrategyBriefSkeleton } from "@/components/analytics/StrategyBriefCard";
import PortalFooter from "@/components/notion/PortalFooter";
import SignOutButton from "../SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientGscPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const supportEmail = getOnboardingSupportEmail();
  const clarityProjectId = process.env.CLARITY_PROJECT_ID?.trim();

  if (!hasDatabase()) {
    return (
      <Shell slug={slug} title="Portal no disponible">
        <p className="text-sm text-zinc-300">
          Escríbenos a <SupportLink email={supportEmail} />.
        </p>
      </Shell>
    );
  }

  const session = await readPortalSession();
  if (!session || session.slug !== slug) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }

  const sql = getDb();
  if (!sql) {
    return (
      <Shell slug={slug} title="Portal no disponible">
        <p className="text-sm text-zinc-300">
          Escríbenos a <SupportLink email={supportEmail} />.
        </p>
      </Shell>
    );
  }

  const project = await getProjectBySlug(sql, slug);
  if (!project) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }

  const allow = await getAllowlistForProject(sql, project.id);
  if (!allow.ready || !allow.emails.includes(session.email)) {
    return (
      <Shell slug={slug} title="Acceso revocado">
        <p className="text-sm text-zinc-300">
          Tu correo ({session.email}) ya no está en la lista autorizada.
        </p>
        <SignOutButton slug={slug} />
      </Shell>
    );
  }

  // Fetch GSC credential (server only — never exposes token to client).
  const cred = await getGscCredential(sql, project.id).catch(() => null);

  if (!cred) {
    return (
      <Shell slug={slug} title="Analytics de búsqueda">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-400">
          Tu operador aún no conectó Google Search Console a este proyecto.
          Cuando lo haga, aquí verás tus métricas de búsqueda: clics,
          impresiones, consultas principales y páginas más visitadas.
        </div>
        <Link
          href={`/client/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          ← Volver al portal
        </Link>
      </Shell>
    );
  }

  // Fetch GSC analytics + Vercel analytics in parallel.
  let dashboardData;
  try {
    dashboardData = await fetchGscDashboardData(cred.refresh_token, cred.property_url);
  } catch (err) {
    console.error("[client/gsc] fetchGscDashboardData failed", err);
    return (
      <Shell slug={slug} title="Analytics de búsqueda">
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-200">
          No pudimos cargar los datos de Google Search Console en este momento.
          Intenta recargar en unos minutos. Si el problema persiste, escríbenos
          a <SupportLink email={supportEmail} />.
        </div>
        <Link
          href={`/client/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          ← Volver al portal
        </Link>
      </Shell>
    );
  }

  const vercelData = isVercelAnalyticsConfigured(project.vercel_project_id)
    ? await fetchVercelAnalyticsDashboard(project.vercel_project_id, 28).catch(() => null)
    : null;

  const siteUrl = project.client_website_url?.trim() ?? "";
  const canPageSpeed = Boolean(siteUrl && isPageSpeedInsightsConfigured());
  const pageSpeedData = canPageSpeed
    ? await fetchPageSpeedInsightsBundle(siteUrl).catch(() => null)
    : null;

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              MenteMaestra · Portal del cliente
            </p>
            <h1 className="text-2xl font-semibold text-zinc-50">
              Analytics
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {project.name} ·{" "}
              <span className="text-zinc-400">{cred.property_url}</span>
            </p>
          </div>
          <SignOutButton slug={slug} />
        </div>

        <Link
          href={`/client/${encodeURIComponent(slug)}`}
          className="mb-8 inline-flex items-center gap-1.5 self-start text-xs uppercase tracking-[0.12em] text-zinc-500 transition hover:text-zinc-300"
        >
          ← Portal
        </Link>

        {/* ── PageSpeed Insights (above GSC) ─────────────────────────────── */}
        {canPageSpeed ? (
          <section className="mb-10">
            <SectionHeading
              className="mb-5"
              icon={<GaugeIcon className="h-4 w-4 text-zinc-500" />}
              title="Rendimiento y accesibilidad"
              tooltip="Google PageSpeed Insights (Lighthouse) en móvil y escritorio: miniaturas del render, rendimiento, accesibilidad, buenas prácticas y SEO técnico para la URL de tu sitio en el proyecto."
            />
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              {pageSpeedData ? (
                <PageSpeedInsightsCard data={pageSpeedData} slug={slug} />
              ) : (
                <p className="text-sm text-zinc-500">
                  No pudimos obtener PageSpeed en este momento. Revisa que la
                  API key tenga habilitada PageSpeed Insights y que la URL del
                  sitio sea pública.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {/* ── Google Search Console ───────────────────────────────────────── */}
        <section className="mb-10">
          <SectionHeading
            className="mb-5"
            icon={<SearchIcon className="h-4 w-4 text-zinc-500" />}
            title="Google Search Console"
            tooltip="Rendimiento de tu sitio en búsquedas de Google: clics, impresiones, posición promedio y consultas principales del período seleccionado."
          />
          <GscDashboard data={dashboardData} />
        </section>

        {/* ── Portal traffic (Vercel Analytics) ───────────────────────────── */}
        {vercelData && (
          <section className="mb-10">
            <SectionHeading
              className="mb-5"
              icon={<BarChartIcon className="h-4 w-4 text-zinc-500" />}
              title="Tráfico del sitio web"
              tooltip="Visitantes únicos, páginas vistas, fuentes de tráfico, países y (si Vercel lo entrega) ciudades o regiones de los últimos 28 días."
            />
            <VercelAnalyticsDashboard data={vercelData} />
          </section>
        )}

        {/* ── Section 4: Heatmaps ─────────────────────────────────────────── */}
        {clarityProjectId && (
          <section className="mb-10">
            <SectionHeading
              className="mb-5"
              icon={<HeatmapIcon className="h-4 w-4 text-zinc-500" />}
              title="Heatmaps"
              tooltip="Grabaciones de sesiones y mapas de calor para entender cómo los usuarios interactúan con cada página."
              badge={
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                  Próximamente
                </span>
              }
            />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
              Grabaciones de sesiones y mapas de calor del sitio web.
              Estarán disponibles directamente en este panel muy pronto.
            </div>
          </section>
        )}

        {/* ── Section 5: Strategy ─────────────────────────────────────────── */}
        {isAnalyticsLlmConfigured() && (
          <section className="mb-10">
            <SectionHeading
              className="mb-5"
              icon={<CompassIcon className="h-4 w-4 text-zinc-500" />}
              title="Estrategia"
              tooltip="El estratega de MenteMaestra analiza tus datos y genera sugerencias de SEO y marketing accionables. Haz clic en cualquier sugerencia para iniciar una conversación, afinar el plan y crear una tarea para que el equipo la implemente."
            />
            <Suspense fallback={<StrategyBriefSkeleton />}>
              <AnalyticsStrategy
                projectId={project.id}
                slug={slug}
                gscData={dashboardData}
                vercelData={vercelData}
              />
            </Suspense>
          </section>
        )}

        <PortalFooter
          slug={slug}
          supportEmail={supportEmail}
          clientWebsiteUrl={project.client_website_url}
        />
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Section heading with CSS tooltip
// ---------------------------------------------------------------------------

function SectionHeading({
  icon,
  title,
  tooltip,
  badge,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {/* Icon with tooltip on hover */}
      <div className="group relative flex items-center">
        <div className="cursor-help">{icon}</div>
        {/* Tooltip */}
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-20 mb-2.5 w-72 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-[11px] leading-relaxed text-zinc-400 opacity-0 shadow-xl shadow-black/50 transition-opacity duration-150 group-hover:opacity-100"
        >
          {tooltip}
          {/* Arrow */}
          <span className="absolute -bottom-[5px] left-3 h-2.5 w-2.5 rotate-45 border-b border-r border-zinc-800 bg-zinc-950" />
        </div>
      </div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {title}
      </h2>
      {badge}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}


function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function GaugeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 14v-3" />
      <path d="M4.5 15.5A8 8 0 0 1 12 4a8 8 0 0 1 7.5 11.5" />
      <path d="M12 14l3-2" />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function HeatmapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-4 4-8 4-8z" />
      <path d="M6.5 14.5C4.6 16.1 3.5 18 3.5 20c0 1.1 1 2 2.2 2h12.6c1.2 0 2.2-.9 2.2-2 0-2-1.1-3.9-3-5.5" />
    </svg>
  );
}

function Shell({
  slug,
  title,
  children,
}: {
  slug: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <header className="mb-8">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
            MenteMaestra · Portal del cliente
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
        </header>
        <Link
          href={`/client/${encodeURIComponent(slug)}`}
          className="mb-6 inline-flex items-center gap-1.5 self-start text-xs uppercase tracking-[0.12em] text-zinc-500 transition hover:text-zinc-300"
        >
          ← Portal
        </Link>
        <div className="space-y-5">{children}</div>
      </div>
    </main>
  );
}

function SupportLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-[#c9a07a] underline underline-offset-2">
      {email}
    </a>
  );
}
