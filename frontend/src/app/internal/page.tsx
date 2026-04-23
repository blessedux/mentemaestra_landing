import Link from "next/link";

import { getDb, hasDatabase } from "@/lib/db";
import { listProjectsWithClient } from "@/lib/onboarding-invite-store";

import NewProjectForm from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function InternalHomePage() {
  const dbReady = hasDatabase();
  const sql = dbReady ? getDb() : null;
  const projects = sql ? await listProjectsWithClient(sql) : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              MenteMaestra · Internal
            </p>
            <h1 className="text-2xl font-semibold text-zinc-50">
              Onboarding CRM
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            {dbReady ? "DB conectada" : "DB no configurada"}
          </p>
        </header>

        {!dbReady ? (
          <p className="rounded-xl border border-amber-900/40 bg-amber-900/10 p-4 text-sm text-amber-200">
            Configura <code className="rounded bg-black/40 px-1">DATABASE_URL</code> y
            aplica la migración <code className="rounded bg-black/40 px-1">002_client_onboarding.sql</code>.
          </p>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
                Proyectos
              </h2>
              {projects.length === 0 ? (
                <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
                  Aún no hay proyectos. Crea el primero abajo.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-900 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/internal/projects/${p.id}`}
                        className="flex items-center justify-between px-4 py-3 transition hover:bg-zinc-900/70"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {p.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {p.client_name} · {p.slug}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-500">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
                Nuevo proyecto
              </h2>
              <NewProjectForm />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
