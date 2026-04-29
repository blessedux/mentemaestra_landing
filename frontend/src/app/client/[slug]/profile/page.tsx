import Link from "next/link";
import { redirect } from "next/navigation";

import PortalFooter from "@/components/notion/PortalFooter";
import { getDb, hasDatabase } from "@/lib/db";
import {
  getAllowlistForProject,
  getProjectBySlug,
} from "@/lib/client-allowlist";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { readPortalSession } from "@/lib/portal-access";

import SignOutButton from "../SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClientProfilePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const supportEmail = getOnboardingSupportEmail();

  if (!hasDatabase()) {
    redirect(`/client/${encodeURIComponent(slug)}`);
  }

  const session = await readPortalSession();
  if (!session || session.slug !== slug) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }
  const isAdmin = session.admin === true;

  const sql = getDb();
  if (!sql) {
    redirect(`/client/${encodeURIComponent(slug)}`);
  }

  const project = await getProjectBySlug(sql, slug);
  if (!project) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }

  const allow = await getAllowlistForProject(sql, project.id);
  if (!isAdmin && (!allow.ready || !allow.emails.includes(session.email))) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              MenteMaestra · Portal del cliente
            </p>
            <h1 className="text-2xl font-semibold text-zinc-50">Mi perfil</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Proyecto:{" "}
              <span className="text-zinc-200">{project.name}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Correo de acceso:{" "}
              <span className="text-zinc-200">{session.email}</span>
            </p>
          </div>
          <SignOutButton slug={slug} />
        </div>

        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          El acceso al portal es por enlace mágico enviado a tu correo. Si
          necesitas cambiar el correo autorizado, pide a tu contacto en
          MenteMaestra que actualice la lista en el panel de operaciones.
        </p>

        <Link
          href={`/client/${encodeURIComponent(slug)}`}
          className="mb-10 inline-flex text-sm text-[#c9a07a] underline-offset-2 hover:underline"
        >
          ← Volver al portal
        </Link>

        <PortalFooter
          slug={slug}
          supportEmail={supportEmail}
          clientWebsiteUrl={project.client_website_url}
        />
      </div>
    </main>
  );
}
