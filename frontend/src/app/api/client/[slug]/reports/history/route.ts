import { getDb, hasDatabase } from "@/lib/db";
import { getProjectBySlug } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { listAnalyticsReportsForProject } from "@/lib/analytics-reports-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  const session = await readPortalSession();
  if (!session || session.slug !== slug || session.admin !== true) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  const sql = getDb();
  if (!sql) return Response.json({ ok: false, error: "no_database" }, { status: 503 });

  const project = await getProjectBySlug(sql, slug);
  if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  const reports = await listAnalyticsReportsForProject(sql, project.id, 50);
  return Response.json({ ok: true, reports });
}

