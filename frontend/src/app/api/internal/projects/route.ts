import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import {
  createClient,
  createProject,
  listProjectsWithClient,
  updateClientNameForProject,
  updateProject,
} from "@/lib/onboarding-invite-store";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/;

function db() {
  if (!hasDatabase()) return null;
  return getDb();
}

export async function GET() {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { ok: false, error: "database_not_configured" },
      { status: 503 },
    );
  }
  const projects = await listProjectsWithClient(sql);
  return NextResponse.json({ ok: true, projects });
}

type CreateBody = {
  client_name: string;
  client_email: string;
  slug: string;
  project_name: string;
  notion_url?: string | null;
  sanity_dataset?: string | null;
  dashboard_project_key?: string | null;
};

type UpdateBody = {
  id: string;
  name?: string;
  client_name?: string;
  notion_url?: string | null;
  sanity_dataset?: string | null;
  dashboard_project_key?: string | null;
  client_website_url?: string | null;
  vercel_project_id?: string | null;
};

function isCreate(body: unknown): body is CreateBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<CreateBody>;
  return (
    typeof b.client_name === "string" &&
    typeof b.client_email === "string" &&
    typeof b.slug === "string" &&
    typeof b.project_name === "string"
  );
}

function isUpdate(body: unknown): body is UpdateBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<UpdateBody>;
  return typeof b.id === "string";
}

export async function POST(req: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { ok: false, error: "database_not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (isCreate(body)) {
    const slug = body.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json(
        { ok: false, error: "invalid_slug" },
        { status: 400 },
      );
    }
    const clientEmail = body.client_email.trim();
    if (!EMAIL_RE.test(clientEmail)) {
      return NextResponse.json(
        { ok: false, error: "invalid_client_email" },
        { status: 400 },
      );
    }
    const clientName = body.client_name.trim();
    const projectName = body.project_name.trim();
    if (!clientName || !projectName) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 },
      );
    }
    const client = await createClient(sql, {
      name: clientName,
      primary_email: clientEmail,
    });
    try {
      const project = await createProject(sql, {
        client_id: client.id,
        slug,
        name: projectName,
        notion_url: body.notion_url?.trim() || null,
        sanity_dataset: body.sanity_dataset?.trim() || null,
        dashboard_project_key: body.dashboard_project_key?.trim() || null,
      });
      return NextResponse.json({ ok: true, project });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/duplicate key|unique constraint/i.test(msg)) {
        return NextResponse.json(
          { ok: false, error: "slug_taken" },
          { status: 409 },
        );
      }
      console.error("[internal/projects] create failed", err);
      return NextResponse.json(
        { ok: false, error: "create_failed" },
        { status: 500 },
      );
    }
  }

  if (isUpdate(body)) {
    const projectName = body.name?.trim();
    const clientName = body.client_name?.trim();
    if (body.name !== undefined && !projectName) {
      return NextResponse.json(
        { ok: false, error: "invalid_project_name" },
        { status: 400 },
      );
    }
    if (body.client_name !== undefined && !clientName) {
      return NextResponse.json(
        { ok: false, error: "invalid_client_name" },
        { status: 400 },
      );
    }
    const project = await updateProject(sql, body.id, {
      name: projectName,
      notion_url:
        body.notion_url === undefined ? undefined : body.notion_url || null,
      sanity_dataset:
        body.sanity_dataset === undefined
          ? undefined
          : body.sanity_dataset || null,
      dashboard_project_key:
        body.dashboard_project_key === undefined
          ? undefined
          : body.dashboard_project_key || null,
      client_website_url:
        body.client_website_url === undefined
          ? undefined
          : body.client_website_url?.trim() || null,
      vercel_project_id:
        body.vercel_project_id === undefined
          ? undefined
          : body.vercel_project_id?.trim() || null,
    });
    if (!project) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }
    if (clientName !== undefined) {
      const ok = await updateClientNameForProject(sql, body.id, clientName);
      if (!ok) {
        return NextResponse.json(
          { ok: false, error: "client_update_failed" },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({ ok: true, project });
  }

  return NextResponse.json(
    { ok: false, error: "invalid_body" },
    { status: 400 },
  );
}
