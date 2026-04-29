import "server-only";

import type postgres from "postgres";

export type AnalyticsReportRow = {
  id: string;
  project_id: string;
  sent_to: string;
  sent_by: string;
  subject: string;
  date_start: string;
  date_end: string;
  created_at: string;
};

export type AnalyticsReportWithHtml = AnalyticsReportRow & {
  html_body: string | null;
};

export async function listAnalyticsReportsForProject(
  sql: ReturnType<typeof postgres>,
  projectId: string,
  limit = 50,
): Promise<AnalyticsReportRow[]> {
  const rows = await sql<AnalyticsReportRow[]>`
    SELECT id::text AS id,
           project_id::text AS project_id,
           sent_to,
           sent_by,
           subject,
           date_start::text AS date_start,
           date_end::text AS date_end,
           created_at::text AS created_at
    FROM project_analytics_reports
    WHERE project_id = ${projectId}::uuid
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function getAnalyticsReportByIdForProject(
  sql: ReturnType<typeof postgres>,
  projectId: string,
  reportId: string,
): Promise<AnalyticsReportWithHtml | null> {
  const rows = await sql<AnalyticsReportWithHtml[]>`
    SELECT id::text AS id,
           project_id::text AS project_id,
           sent_to,
           sent_by,
           subject,
           date_start::text AS date_start,
           date_end::text AS date_end,
           created_at::text AS created_at,
           html_body
    FROM project_analytics_reports
    WHERE project_id = ${projectId}::uuid
      AND id = ${reportId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function insertAnalyticsReport(
  sql: ReturnType<typeof postgres>,
  input: {
    projectId: string;
    sentTo: string;
    sentBy: string;
    subject: string;
    dateStart: string;
    dateEnd: string;
    htmlBody: string | null;
  },
): Promise<AnalyticsReportRow | null> {
  const rows = await sql<AnalyticsReportRow[]>`
    INSERT INTO project_analytics_reports
      (project_id, sent_to, sent_by, subject, date_start, date_end, html_body)
    VALUES (
      ${input.projectId}::uuid,
      ${input.sentTo},
      ${input.sentBy},
      ${input.subject},
      ${input.dateStart}::date,
      ${input.dateEnd}::date,
      ${input.htmlBody}
    )
    ON CONFLICT (project_id, sent_to, date_start, date_end) DO NOTHING
    RETURNING id::text AS id,
              project_id::text AS project_id,
              sent_to,
              sent_by,
              subject,
              date_start::text AS date_start,
              date_end::text AS date_end,
              created_at::text AS created_at
  `;
  const row = rows[0];
  return row ?? null;
}

