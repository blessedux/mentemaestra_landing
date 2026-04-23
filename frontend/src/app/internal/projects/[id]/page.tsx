import Link from "next/link";
import { notFound } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import {
  getLatestSubmissionForProject,
  getProjectWithClientById,
  listInvitesForProject,
} from "@/lib/onboarding-invite-store";
import { getOnboardingPublicBaseUrl } from "@/lib/onboarding-env";

import ProjectDetailPanel from "./ProjectDetailPanel";
import TeamMembersPanel from "./TeamMembersPanel";

type AccessKey = "notion" | "cms" | "ops";
const ACCESS_SET = new Set<AccessKey>(["notion", "cms", "ops"]);

function sanitizeAccesses(raw: unknown): AccessKey[] {
  if (!Array.isArray(raw)) return [];
  const out: AccessKey[] = [];
  for (const a of raw) {
    if (typeof a !== "string") continue;
    if (!ACCESS_SET.has(a as AccessKey)) continue;
    if (!out.includes(a as AccessKey)) out.push(a as AccessKey);
  }
  return out;
}

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!hasDatabase()) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-100">
        <div className="mx-auto w-full max-w-3xl">
          <p className="rounded-xl border border-amber-900/40 bg-amber-900/10 p-4 text-sm text-amber-200">
            Configura <code className="rounded bg-black/40 px-1">DATABASE_URL</code> para usar el CRM.
          </p>
        </div>
      </main>
    );
  }
  const sql = getDb();
  if (!sql) notFound();

  const project = await getProjectWithClientById(sql, id);
  if (!project) notFound();

  const invites = await listInvitesForProject(sql, project.id);
  const submission = await getLatestSubmissionForProject(sql, project.id);
  const initialStakeholders = submission
    ? submission.stakeholders
        .map((s) => ({
          email: typeof s.email === "string" ? s.email : "",
          accesses: sanitizeAccesses(s.accesses),
        }))
        .filter((s) => s.email.length > 0)
    : [];

  // Portal URLs are always personal + signed (each allowlisted member gets
  // their own link in their welcome email). We still surface the bare,
  // unauthenticated URL here so the operator can preview the portal as the
  // operator, paste it as a reference, or share the info page to someone who
  // lost their welcome email.
  const portalBaseUrl = getOnboardingPublicBaseUrl().replace(/\/$/, "");
  const portalHref = `/client/${encodeURIComponent(project.slug)}`;
  const portalAbsoluteUrl = `${portalBaseUrl}${portalHref}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <Link
            href="/internal"
            className="text-xs uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-300"
          >
            ← Proyectos
          </Link>
        </div>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              {project.client_name}
            </p>
            <h1 className="text-2xl font-semibold text-zinc-50">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Slug: {project.slug}
            </p>
          </div>
          <Link
            href={portalHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Abre el portal del cliente (misma vista que el cliente) en una pestaña nueva"
            className="inline-flex items-center gap-2 rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2 text-xs font-semibold text-[#faf7f5] shadow-sm transition hover:brightness-110"
          >
            <ExternalIcon className="h-3.5 w-3.5" />
            Ver portal del cliente
          </Link>
        </header>

        <ProjectDetailPanel
          projectId={project.id}
          projectSlug={project.slug}
          defaultNotionUrl={project.notion_url ?? ""}
          defaultSanityDataset={project.sanity_dataset ?? ""}
          defaultDashboardKey={project.dashboard_project_key ?? ""}
          defaultClientWebsiteUrl={project.client_website_url ?? ""}
          clientEmail={project.client_primary_email}
          projectName={project.name}
          clientName={project.client_name}
          portalLoginUrl={portalAbsoluteUrl}
          portalHref={portalHref}
        />

        <div className="mt-10">
          <TeamMembersPanel
            projectId={project.id}
            ready={Boolean(submission)}
            adminEmail={submission?.admin_email ?? null}
            initialStakeholders={initialStakeholders}
          />
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
            Historial de invitaciones
          </h2>
          {invites.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
              Aún no se han enviado invitaciones.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-900 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
              {invites.map((i) => {
                const expired = new Date(i.expires_at).getTime() <= Date.now();
                const state = i.used_at
                  ? "Usado"
                  : expired
                    ? "Caducado"
                    : "Pendiente";
                return (
                  <li
                    key={i.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="text-zinc-100">{i.sent_to_email}</p>
                      <p className="text-xs text-zinc-500">
                        Enviado por {i.sent_by} · {formatDate(i.created_at)}
                      </p>
                    </div>
                    <span
                      className={
                        i.used_at
                          ? "text-xs text-emerald-300"
                          : expired
                            ? "text-xs text-zinc-500"
                            : "text-xs text-[#c9a07a]"
                      }
                    >
                      {state}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 3h7v7" />
      <path d="M21 3l-9 9" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}
