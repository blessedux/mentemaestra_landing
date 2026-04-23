import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb, hasDatabase } from "@/lib/db";
import {
  getAllowlistForProject,
  getProjectBySlug,
} from "@/lib/client-allowlist";
import {
  getDatabaseMeta,
  getPageMeta,
  parseNotionId,
  queryProjectDatabase,
  resolveNotionContentMode,
} from "@/lib/notion-client";
import NotionPortalPage from "@/components/notion/NotionPortalPage";
import NotionDatabaseGallery from "@/components/notion/NotionDatabaseGallery";
import NotionKanbanBoard from "@/components/notion/NotionKanbanBoard";
import PortalFooter from "@/components/notion/PortalFooter";
import { getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { readPortalSession } from "@/lib/portal-access";

import SignOutButton from "../../SignOutButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; pageId: string }>;
};

export default async function NotionSubPage({ params }: PageProps) {
  const { slug: rawSlug, pageId } = await params;
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
    return (
      <Shell slug={slug} title="Proyecto no encontrado">
        <p className="text-sm text-zinc-300">
          No pudimos ubicar este proyecto.{" "}
          <SupportLink email={supportEmail} />
        </p>
      </Shell>
    );
  }

  const allow = await getAllowlistForProject(sql, project.id);
  if (!allow.ready || !allow.emails.includes(session.email)) {
    return (
      <Shell slug={slug} title="Acceso no autorizado">
        <p className="text-sm text-zinc-300">
          El correo {session.email} no está autorizado para este proyecto.
        </p>
        <SignOutButton slug={slug} />
      </Shell>
    );
  }

  const resolvedId = parseNotionId(pageId) ?? pageId;

  // Auto-detect: database (show row cards) vs page (show block tree).
  const mode = await resolveNotionContentMode(resolvedId);

  // ── Access / resolution error ──────────────────────────────────────────────
  if (mode.mode === "error") {
    const hint =
      mode.reason === "unauthorized"
        ? "La integración de Notion no tiene acceso a este contenido. En Notion abre la página o BD → ··· → Connections → agrega la integración MenteMaestra."
        : mode.reason === "not_found"
          ? "No encontramos el contenido vinculado. El enlace puede estar desactualizado."
          : "No pudimos conectar con Notion en este momento. Intenta recargar en unos minutos.";
    return (
      <Shell slug={slug} title="Contenido no disponible">
        <p className="text-sm text-zinc-400">{hint}</p>
      </Shell>
    );
  }

  // ── Database view (gallery grid or kanban board) ─────────────────────────
  if (mode.mode === "database") {
    const [rowsResult, dbMeta] = await Promise.all([
      queryProjectDatabase(mode.id),
      getDatabaseMeta(mode.id), // go straight to /databases/{id} — we already know it's a DB
    ]);

    const dbIcon = dbMeta.icon;
    const isBoard = (dbMeta.boardColumns?.length ?? 0) > 0;

    // For kanban boards, use full-width layout so columns can scroll horizontally
    const contentMaxWidth = isBoard ? "max-w-[90vw] xl:max-w-7xl" : "max-w-5xl";

    return (
      <main className="flex min-h-screen flex-col bg-[#0a0a0a] text-zinc-100">
        {/* Banner at viewport top — header overlaid inside */}
        {dbMeta.coverUrl ? (
          <div className="relative h-64 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dbMeta.coverUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 backdrop-blur-[14px] [mask-image:linear-gradient(to_bottom,transparent_25%,black_75%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_25%,black_75%)]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
            <div className="absolute inset-x-0 top-0 z-10 px-6 pt-6">
              <div className={["mx-auto", contentMaxWidth].join(" ")}>
                <Header slug={slug} projectName={project.name} overlay>
                  <SignOutButton slug={slug} />
                </Header>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={[
            "mx-auto flex w-full flex-1 flex-col px-6 pb-12",
            contentMaxWidth,
            dbMeta.coverUrl ? "pt-8" : "pt-12",
          ].join(" ")}
        >
          {!dbMeta.coverUrl && (
            <Header slug={slug} projectName={project.name}>
              <SignOutButton slug={slug} />
            </Header>
          )}

          <div className="mb-8">
            {dbIcon?.type === "emoji" && (
              <div className="mb-2 text-4xl leading-none" aria-hidden="true">
                {dbIcon.value}
              </div>
            )}
            {dbIcon?.type === "url" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dbIcon.value} alt="" className="mb-2 h-10 w-10 rounded object-contain" />
            )}
            <h1 className="text-2xl font-bold text-zinc-50">
              {dbMeta.title || (isBoard ? "Tablero" : "Base de datos")}
            </h1>
          </div>

          {!rowsResult.ok ? (
            <Notice>
              No pudimos cargar esta base de datos.{" "}
              {rowsResult.reason === "unauthorized"
                ? "La integración de Notion no tiene acceso. Conecta la integración en Notion → ··· → Connections."
                : "Intenta recargar la página en unos minutos."}
            </Notice>
          ) : rowsResult.rows.length === 0 ? (
            <Notice>Esta base de datos no tiene entradas aún.</Notice>
          ) : isBoard ? (
            <NotionKanbanBoard
              columns={dbMeta.boardColumns!}
              rows={rowsResult.rows}
              slug={slug}
            />
          ) : (
            <NotionDatabaseGallery rows={rowsResult.rows} slug={slug} />
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

  // ── Page / block-tree view ─────────────────────────────────────────────────
  // Fetch page meta here so we can render the banner at the viewport top,
  // outside the padded content container, with the nav overlaid on top.
  const pageMeta = await getPageMeta(resolvedId);

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] text-zinc-100">
      {/* Banner at viewport top — header overlaid inside */}
      {pageMeta.coverUrl ? (
        <div className="relative h-64 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pageMeta.coverUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 backdrop-blur-[14px] [mask-image:linear-gradient(to_bottom,transparent_25%,black_75%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_25%,black_75%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          {/* Nav overlaid at the top of the banner */}
          <div className="absolute inset-x-0 top-0 z-10 px-6 pt-6">
            <div className="mx-auto max-w-4xl">
              <Header slug={slug} projectName={project.name} overlay>
                <SignOutButton slug={slug} />
              </Header>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={[
          "mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pb-12",
          pageMeta.coverUrl ? "pt-8" : "pt-12",
        ].join(" ")}
      >
        {!pageMeta.coverUrl && (
          <Header slug={slug} projectName={project.name}>
            <SignOutButton slug={slug} />
          </Header>
        )}

        <NotionPortalPage
          pageId={resolvedId}
          slug={slug}
          supportEmail={supportEmail}
          skipBanner
        />

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
// Shared layout pieces
// ---------------------------------------------------------------------------

function Header({
  slug,
  projectName,
  children,
  overlay = false,
}: {
  slug: string;
  projectName: string;
  children?: React.ReactNode;
  /** When true, text is white with drop-shadow for readability over a cover image. */
  overlay?: boolean;
}) {
  return (
    <div className={["flex items-start justify-between gap-4", overlay ? "mb-0" : "mb-8"].join(" ")}>
      <div>
        <p
          className={[
            "mb-1 text-xs uppercase tracking-[0.18em]",
            overlay ? "text-white/55 drop-shadow" : "text-zinc-500",
          ].join(" ")}
        >
          MenteMaestra · Portal del cliente
        </p>
        <Link
          href={`/client/${encodeURIComponent(slug)}`}
          className={[
            "text-sm underline-offset-2 hover:underline",
            overlay ? "text-white/80 drop-shadow" : "text-[#c9a07a]",
          ].join(" ")}
        >
          ← {projectName}
        </Link>
      </div>
      {children}
    </div>
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
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
            MenteMaestra
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
          <Link
            href={`/client/${encodeURIComponent(slug)}`}
            className="mt-2 inline-block text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Volver al portal
          </Link>
        </header>
        <div className="space-y-5">{children}</div>
      </div>
    </main>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
      {children}
    </div>
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
