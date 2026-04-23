import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import { getProjectBySlug } from "@/lib/client-allowlist";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { readPortalSession } from "@/lib/portal-access";

import PortalLoginForm from "./PortalLoginForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reason?: string | string[] }>;
};

/**
 * Portal login: allowlisted users request a signed magic link by email, or
 * return to the public site. Successful `/enter` exchanges the token for a
 * session cookie (see `src/lib/portal-access.ts`).
 */
export default async function ClientLoginPage({
  params,
  searchParams,
}: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();
  const sp = await searchParams;
  const reason = pickReason(sp.reason);
  const supportEmail = getOnboardingSupportEmail();

  const session = await readPortalSession();
  if (session?.slug === slug) {
    redirect(`/client/${encodeURIComponent(slug)}`);
  }

  let projectName: string | null = null;
  if (hasDatabase()) {
    const sql = getDb();
    if (sql) {
      const project = await getProjectBySlug(sql, slug);
      if (!project) {
        return (
          <Shell title="Proyecto no encontrado">
            <p className="text-sm text-zinc-300">
              Verifica el enlace o escríbenos a{" "}
              <SupportLink email={supportEmail} />.
            </p>
            <Link
              href="/"
              className="inline-block text-xs uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-300"
            >
              ← Volver a MenteMaestra
            </Link>
          </Shell>
        );
      }
      projectName = project.name;
    }
  }

  const copy = reasonCopy(reason);

  return (
    <Shell
      title="Acceso al portal"
      subtitle={projectName ? projectName : undefined}
    >
      <p className="text-sm leading-relaxed text-zinc-300">{copy.lead}</p>
      {projectName ? (
        <p className="text-sm text-zinc-200">
          Proyecto:{" "}
          <strong className="text-zinc-50">{projectName}</strong>
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-zinc-400">{copy.detail}</p>
      <p className="text-sm leading-relaxed text-zinc-400">
        ¿No llega el correo? Escríbenos a{" "}
        <SupportLink email={supportEmail} />.
      </p>

      {hasDatabase() && projectName ? (
        <div className="border-t border-zinc-800/80 pt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Pedir un nuevo enlace
          </h2>
          <PortalLoginForm slug={slug} />
        </div>
      ) : (
        <p className="border-t border-zinc-800/80 pt-6 text-sm text-zinc-500">
          El portal no está disponible sin base de datos configurada.
        </p>
      )}
    </Shell>
  );
}

function pickReason(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? "";
  return typeof raw === "string" ? raw : "";
}

function reasonCopy(reason: string): { lead: string; detail: string } {
  switch (reason) {
    case "invalid_token":
    case "missing_token":
      return {
        lead:
          "El enlace que usaste no es válido o ha caducado para este portal.",
        detail:
          "Por seguridad, los enlaces están firmados. Pide un nuevo enlace abajo o abre el correo más reciente de MenteMaestra.",
      };
    case "slug_mismatch":
      return {
        lead: "Este enlace no corresponde al proyecto de esta URL.",
        detail:
          "Revisa la dirección o pide un nuevo enlace con tu correo autorizado.",
      };
    case "forbidden":
      return {
        lead: "Tu correo no está en la lista autorizada de este portal.",
        detail:
          "Si deberías tener acceso, pide al administrador del proyecto que te agregue.",
      };
    case "not_ready":
      return {
        lead: "Todavía estamos habilitando este portal.",
        detail:
          "Cuando el administrador termine la configuración recibirás un correo con tu enlace.",
      };
    case "no_session":
      return {
        lead:
          "Has cerrado sesión o este dispositivo ya no tiene una sesión activa.",
        detail:
          "Escribe abajo el correo con el que te dieron acceso; te enviaremos un enlace mágico para volver a entrar.",
      };
    case "unavailable":
      return {
        lead: "No pudimos validar tu acceso en este momento.",
        detail: "Vuelve a intentarlo en unos minutos o pide un nuevo enlace.",
      };
    case "not_found":
      return {
        lead: "No pudimos ubicar el proyecto de este enlace.",
        detail: "Verifica la URL o escríbenos a soporte.",
      };
    default:
      return {
        lead: "Entra con un enlace mágico que te enviamos por correo.",
        detail:
          "Si ya no tienes el correo, escribe tu dirección abajo y te enviamos uno nuevo (solo si estás en la lista autorizada).",
      };
  }
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
            MenteMaestra · Login del portal
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#c9a07a]">{subtitle}</p>
          ) : null}
        </header>
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
          {children}
        </div>
        <Link
          href="/"
          className="mt-8 block text-center text-xs uppercase tracking-[0.14em] text-zinc-600 transition hover:text-zinc-400"
        >
          ← Volver a MenteMaestra
        </Link>
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
