import { notFound } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { getInviteByTokenHash } from "@/lib/onboarding-invite-store";
import {
  hashInviteToken,
  isPlausibleInviteToken,
} from "@/lib/onboarding-token";

import ClientAccessForm from "./ClientAccessForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

type LoadResult =
  | {
      status: "ok";
      token: string;
      projectName: string;
      clientName: string;
      sentToEmail: string;
      expiresAt: string;
    }
  | { status: "not_found" | "used" | "expired" | "db_missing" };

async function loadInvite(token: string): Promise<LoadResult> {
  if (!isPlausibleInviteToken(token)) return { status: "not_found" };
  if (!hasDatabase()) return { status: "db_missing" };
  const sql = getDb();
  if (!sql) return { status: "db_missing" };
  const row = await getInviteByTokenHash(sql, hashInviteToken(token));
  if (!row) return { status: "not_found" };
  if (row.used_at) return { status: "used" };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { status: "expired" };
  }
  return {
    status: "ok",
    token,
    projectName: row.project_name,
    clientName: row.client_name,
    sentToEmail: row.sent_to_email,
    expiresAt: row.expires_at,
  };
}

function StatusCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 py-16 text-zinc-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          MenteMaestra
        </p>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-50">{title}</h1>
        <p className="text-sm leading-relaxed text-zinc-400">{body}</p>
      </div>
    </main>
  );
}

export default async function ClientAccessPage({ params }: PageProps) {
  const { token } = await params;
  const result = await loadInvite(token);
  const supportEmail = getOnboardingSupportEmail();

  if (result.status === "not_found") notFound();
  if (result.status === "db_missing") {
    return (
      <StatusCard
        title="Servicio no disponible"
        body={`La base de datos de onboarding no está configurada. Si recibiste este enlace, escríbenos a ${supportEmail} y te enviaremos otro acceso.`}
      />
    );
  }
  if (result.status === "used") {
    return (
      <StatusCard
        title="Este enlace ya fue utilizado"
        body={`El formulario ya recibió los datos de tu proyecto. Si necesitas ajustar tu equipo, escríbenos a ${supportEmail}; cuando el dashboard de MenteMaestra esté activo para tu proyecto también podrás editarlo desde tu perfil.`}
      />
    );
  }
  if (result.status === "expired") {
    return (
      <StatusCard
        title="Enlace caducado"
        body={`Este enlace de acceso ha expirado. Responde al correo original o escríbenos a ${supportEmail} y generamos uno nuevo.`}
      />
    );
  }

  if (result.status !== "ok") notFound();

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-zinc-100">
      <div className="mx-auto w-full max-w-xl">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          MenteMaestra
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-50">
          Acceso a {result.projectName}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-400">
          Hola {result.clientName}. Comparte tu correo de administrador y los
          correos de las personas que deberán acceder a Notion, el CMS y el
          panel de operaciones. Este formulario se envía <strong>una sola vez</strong>;
          al enviarlo te redirigiremos a la página del proyecto.
        </p>
        <ClientAccessForm
          token={result.token}
          defaultAdminEmail={result.sentToEmail}
          supportEmail={supportEmail}
        />
      </div>
    </main>
  );
}
