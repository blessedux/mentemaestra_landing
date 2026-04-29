import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import { getAllowlistForProject, getProjectBySlug } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import PortalFooter from "@/components/notion/PortalFooter";
import SignOutButton from "../SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientTicketsPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const supportEmail = getOnboardingSupportEmail();

  if (!hasDatabase()) {
    return (
      <Shell slug={slug} title="Soporte">
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
  const isAdmin = session.admin === true;

  const sql = getDb();
  if (!sql) {
    return (
      <Shell slug={slug} title="Soporte">
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
  if (!isAdmin && (!allow.ready || !allow.emails.includes(session.email))) {
    return (
      <Shell slug={slug} title="Acceso revocado">
        <p className="text-sm text-zinc-300">
          Tu correo ({session.email}) ya no está en la lista autorizada.
        </p>
        <SignOutButton slug={slug} />
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
              Soporte y seguimiento
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {project.name} ·{" "}
              <span className="text-zinc-400">{session.email}</span>
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

        {/* Placeholder content */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="mb-2 text-sm font-semibold text-zinc-200">
              ¿Tienes una consulta o solicitud?
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-zinc-400">
              Escríbenos directamente y te responderemos a la brevedad. Menciona
              el nombre del proyecto en el asunto para que podamos ubicar tu
              caso rápidamente.
            </p>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                `[${project.name}] Consulta / soporte`,
              )}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-5 py-2.5 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110"
            >
              Enviar correo de soporte
            </a>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-sm text-zinc-500">
            El sistema de tickets está en desarrollo. Próximamente podrás
            crear, seguir y comentar solicitudes directamente desde este portal.
          </div>
        </div>

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
