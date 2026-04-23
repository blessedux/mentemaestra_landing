import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import {
  getAllowlistForProject,
  getProjectBySlug,
} from "@/lib/client-allowlist";
import { resolveNotionContentMode } from "@/lib/notion-client";
import NotionRowList from "@/components/notion/NotionRowList";
import NotionPortalPage from "@/components/notion/NotionPortalPage";
import PortalFooter from "@/components/notion/PortalFooter";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { readPortalSession } from "@/lib/portal-access";

import SignOutButton from "./SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientDashboardPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const supportEmail = getOnboardingSupportEmail();

  if (!hasDatabase()) {
    return (
      <Shell title="Portal no disponible">
        <p className="text-sm text-zinc-300">
          Configura la base de datos y vuelve a intentar.
        </p>
      </Shell>
    );
  }

  // Session cookie must exist AND belong to this project. Cross-project or
  // missing/expired sessions bounce to the login info page so the recipient
  // knows to reopen their welcome email.
  const session = await readPortalSession();
  if (!session || session.slug !== slug) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }

  const sql = getDb();
  if (!sql) {
    return (
      <Shell title="Portal no disponible">
        <p className="text-sm text-zinc-300">
          Escríbenos a <SupportLink email={supportEmail} />.
        </p>
      </Shell>
    );
  }

  const project = await getProjectBySlug(sql, slug);
  if (!project) {
    return (
      <Shell title="Proyecto no encontrado">
        <p className="text-sm text-zinc-300">
          No pudimos ubicar este proyecto. Verifica el enlace o escríbenos a{" "}
          <SupportLink email={supportEmail} />.
        </p>
        <Link
          href="/"
          className="inline-block text-xs uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-300"
        >
          ← Volver al inicio
        </Link>
      </Shell>
    );
  }

  // Re-check the live allowlist on every render: removing a stakeholder
  // from the operator panel locks them out immediately, even if their
  // cookie hasn't expired.
  const allow = await getAllowlistForProject(sql, project.id);
  if (!allow.ready) {
    return (
      <Shell title="Portal aún no disponible">
        <p className="text-sm text-zinc-300">
          El equipo todavía no terminó la configuración del portal. Inténtalo
          de nuevo más tarde o escríbenos a{" "}
          <SupportLink email={supportEmail} />.
        </p>
      </Shell>
    );
  }

  if (!allow.emails.includes(session.email)) {
    return (
      <Shell title="Acceso revocado">
        <p className="text-sm text-zinc-300">
          Tu correo ({session.email}) ya no está en la lista autorizada para
          este proyecto. Si crees que debería estarlo, escribe a{" "}
          <SupportLink email={supportEmail} />.
        </p>
        <SignOutButton slug={slug} />
      </Shell>
    );
  }

  // Detect whether notion_url is a database or a single page.
  const notionMode = await resolveNotionContentMode(project.notion_url);

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              MenteMaestra · Portal del cliente
            </p>
            <h1 className="text-2xl font-semibold text-zinc-50">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Sesión: <span className="text-zinc-300">{session.email}</span>
            </p>
          </div>
          <SignOutButton slug={slug} />
        </div>

        {notionMode.mode === "page" ? (
          <NotionPortalPage
            pageId={notionMode.id}
            slug={slug}
            supportEmail={supportEmail}
          />
        ) : notionMode.mode === "database" ? (
          <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
              Espacio de trabajo
            </h2>
            <NotionRowList
              notionUrl={project.notion_url}
              supportEmail={supportEmail}
            />
          </section>
        ) : (
          // No URL configured or error resolving mode — pass null so
          // NotionRowList shows its friendly "not configured" empty state
          // instead of retrying an already-failed request.
          <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
              Espacio de trabajo
            </h2>
            <NotionRowList
              notionUrl={null}
              supportEmail={supportEmail}
            />
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

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
            MenteMaestra
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
        </header>
        <div className="space-y-5">{children}</div>
      </div>
    </main>
  );
}

function SupportLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-[#c9a07a] underline underline-offset-2"
    >
      {email}
    </a>
  );
}
