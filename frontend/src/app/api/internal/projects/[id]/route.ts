import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import {
  deleteProjectCascade,
  getProjectWithClientById,
} from "@/lib/onboarding-invite-store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
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

  // Require the caller to echo the project name back in the body. This is a
  // belt-and-suspenders check on top of the UI's type-the-name confirmation:
  // if a stray client, tab, or curl request hits this endpoint without the
  // matching name, we refuse. Case-sensitive, exact match.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  const confirmName =
    body && typeof body === "object"
      ? (body as { confirm_name?: unknown }).confirm_name
      : undefined;
  if (typeof confirmName !== "string" || confirmName.length === 0) {
    return NextResponse.json(
      { ok: false, error: "confirm_name_required" },
      { status: 400 },
    );
  }

  const existing = await getProjectWithClientById(sql, id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }
  if (confirmName !== existing.name) {
    return NextResponse.json(
      { ok: false, error: "confirm_name_mismatch" },
      { status: 400 },
    );
  }

  const result = await deleteProjectCascade(sql, id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, project_name: result.project_name });
}
