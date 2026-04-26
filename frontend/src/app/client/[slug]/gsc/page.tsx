import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getDb, hasDatabase } from "@/lib/db";
import { getAllowlistForProject, getProjectBySlug } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { getGscCredential } from "@/lib/gsc-store";
import { fetchGscDashboardData } from "@/lib/gsc-client";
import { fetchVercelAnalyticsDashboard, isVercelAnalyticsConfigured } from "@/lib/vercel-analytics-client";
import { isOpenAiConfigured } from "@/lib/seo-insights";
import GscDashboard from "@/components/gsc/GscDashboard";
import SeoInsights, { SeoInsightsSkeleton } from "@/components/gsc/SeoInsights";
import VercelAnalyticsDashboard from "@/components/analytics/VercelAnalyticsDashboard";
import PortalFooter from "@/components/notion/PortalFooter";
import SignOutButton from "../SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientGscPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const supportEmail = getOnboardingSupportEmail();
  const clarityProjectId = process.env.CLARITY_PROJECT_ID?.trim();
  const acceptLang = (await headers()).get("accept-language") ?? "";
  const isSpanish = !acceptLang || /^es/i.test(acceptLang.split(",")[0].trim());

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

        {/* ── Section 1: Google Search Console ───────────────────────────── */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <SearchIcon className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Google Search Console
            </h2>
          </div>
          <GscDashboard data={dashboardData} />
        </section>

        {/* ── Section 2: AI SEO Insights (streamed) ──────────────────────── */}
        {isOpenAiConfigured() && (
          <section className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <SparklesIcon className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Búsquedas en IA
              </h2>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                IA
              </span>
              <div className="group relative ml-0.5">
                <button
                  type="button"
                  aria-label="Más información sobre Búsquedas en IA"
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-bold text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
                >
                  ?
                </button>
                <div className="pointer-events-none invisible absolute left-0 top-6 z-20 w-72 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed shadow-xl shadow-black/60">
                    <p className="mb-2 font-semibold text-zinc-200">
                      {isSpanish ? "¿Qué es esto?" : "What is this?"}
                    </p>
                    <p className="text-zinc-400">
                      {isSpanish
                        ? "GPT‑4o mini analiza tus datos reales de Google Search Console — clics, impresiones, CTR y posición promedio — y genera recomendaciones concretas para mejorar tu visibilidad en buscadores. Se actualiza una vez al día."
                        : "GPT‑4o mini analyzes your real Google Search Console data — clicks, impressions, CTR, and average position — and produces actionable recommendations to improve your search engine visibility. Updated once per day."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Suspense fallback={<SeoInsightsSkeleton />}>
              <SeoInsights projectId={project.id} gscData={dashboardData} />
            </Suspense>
          </section>
        )}

        {/* ── Section 3: Portal traffic (Vercel Analytics) ───────────────── */}
        {vercelData && (
          <section className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <BarChartIcon className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Tráfico del sitio web
              </h2>
            </div>
            <VercelAnalyticsDashboard data={vercelData} />
          </section>
        )}

        {/* ── Section 4: Heatmaps (Microsoft Clarity) ────────────────────── */}
        {clarityProjectId && (
          <section className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <HeatmapIcon className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Heatmaps (Microsoft Clarity)
              </h2>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-300">
              <p className="mb-3 text-zinc-300">
                {isSpanish
                  ? "Los heatmaps y grabaciones se ven en el panel de Microsoft Clarity (no dentro del portal)."
                  : "Heatmaps and recordings are viewed in Microsoft Clarity (not inside this portal)."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://clarity.microsoft.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 transition hover:border-zinc-500"
                >
                  {isSpanish ? "Abrir Clarity" : "Open Clarity"}
                </a>
                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-400">
                  CLARITY_PROJECT_ID: <span className="font-mono text-zinc-200">{clarityProjectId}</span>
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {isSpanish
                  ? "Nota: puede tardar unos minutos y requiere tráfico real en el dominio desplegado para que aparezcan datos."
                  : "Note: it can take a few minutes and requires real traffic on the deployed domain for data to appear."}
              </p>
            </div>
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
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
