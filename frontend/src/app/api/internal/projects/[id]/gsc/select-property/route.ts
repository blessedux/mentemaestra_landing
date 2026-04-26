import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import { updateGscProperty } from "@/lib/gsc-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/internal/projects/[id]/gsc/select-property
 * Body: { credential_id: string; property_url: string }
 *
 * Called from the property-selection modal after OAuth completes.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id: _projectId } = await params;

  if (!hasDatabase()) {
    return NextResponse.json(
      { ok: false, error: "database_not_configured" },
      { status: 503 },
    );
  }
  const sql = getDb();
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

  const { credential_id, property_url } =
    (body as { credential_id?: string; property_url?: string }) ?? {};

  if (!credential_id || !property_url) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  const updated = await updateGscProperty(sql, credential_id, property_url);
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "credential_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
