import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import { getAllowlistForProject, getProjectBySlug } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { getGscCredential } from "@/lib/gsc-store";
import { fetchGscDashboardData } from "@/lib/gsc-client";
import GscDashboard from "@/components/gsc/GscDashboard";
import PortalFooter from "@/components/notion/PortalFooter";
import SignOutButton from "../SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientGscPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const supportEmail = getOnboardingSupportEmail();

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

  // Fetch analytics — show error state on failure (rate limit, revoked token, etc.)
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
              Analytics de búsqueda
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
          className="mb-6 inline-flex items-center gap-1.5 self-start text-xs uppercase tracking-[0.12em] text-zinc-500 transition hover:text-zinc-300"
        >
          ← Portal
        </Link>

        <GscDashboard data={dashboardData} />

        <PortalFooter
          slug={slug}
          supportEmail={supportEmail}
          clientWebsiteUrl={project.client_website_url}
        />
      </div>
    </main>
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
