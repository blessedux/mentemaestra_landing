import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import { getGscStatus, revokeGscCredential } from "@/lib/gsc-store";
import { getGscCredential } from "@/lib/gsc-store";
import { revokeGoogleToken } from "@/lib/gsc-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function nodb() {
  return NextResponse.json(
    { ok: false, error: "database_not_configured" },
    { status: 503 },
  );
}

/** GET /api/internal/projects/[id]/gsc — connection status (no token). */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!hasDatabase()) return nodb();
  const sql = getDb();
  if (!sql) return nodb();

  const status = await getGscStatus(sql, id);
  return NextResponse.json({ ok: true, status });
}

/** DELETE /api/internal/projects/[id]/gsc — disconnect GSC. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!hasDatabase()) return nodb();
  const sql = getDb();
  if (!sql) return nodb();

  // Best-effort: grab the refresh token first so we can revoke at Google.
  const cred = await getGscCredential(sql, id).catch(() => null);

  const revoked = await revokeGscCredential(sql, id);
  if (!revoked) {
    return NextResponse.json(
      { ok: false, error: "not_connected" },
      { status: 404 },
    );
  }

  // Revoke at Google in the background (fire-and-forget).
  if (cred?.refresh_token) {
    revokeGoogleToken(cred.refresh_token).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
