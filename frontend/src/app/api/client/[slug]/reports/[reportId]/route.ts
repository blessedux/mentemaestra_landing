import { getDb, hasDatabase } from "@/lib/db";
import { getProjectBySlug } from "@/lib/client-allowlist";
import { readPortalSession } from "@/lib/portal-access";
import { getAnalyticsReportByIdForProject } from "@/lib/analytics-reports-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; reportId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug: rawSlug, reportId: rawReportId } = await params;
  const slug = rawSlug.toLowerCase();
  const reportId = rawReportId.trim();

  const session = await readPortalSession();
  if (!session || session.slug !== slug || session.admin !== true) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  const sql = getDb();
  if (!sql) return Response.json({ ok: false, error: "no_database" }, { status: 503 });

  const project = await getProjectBySlug(sql, slug);
  if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  const row = await getAnalyticsReportByIdForProject(sql, project.id, reportId);
  if (!row) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  return Response.json({
    ok: true,
    report: {
      id: row.id,
      sent_to: row.sent_to,
      sent_by: row.sent_by,
      subject: row.subject,
      date_start: row.date_start,
      date_end: row.date_end,
      created_at: row.created_at,
      html: row.html_body,
    },
  });
}
