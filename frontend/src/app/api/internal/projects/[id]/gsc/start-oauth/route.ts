import { NextResponse } from "next/server";

import { buildGscAuthUrl, isGscConfigured } from "@/lib/gsc-client";
import { hasEncryptionKey } from "@/lib/gsc-token-crypt";
import { buildOAuthState } from "@/lib/gsc-oauth-state";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/internal/projects/[id]/gsc/start-oauth
 * Returns the Google OAuth authorization URL to redirect the operator to.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;

  if (!isGscConfigured()) {
    return NextResponse.json(
      { ok: false, error: "gsc_not_configured" },
      { status: 503 },
    );
  }

  if (!hasEncryptionKey()) {
    return NextResponse.json(
      { ok: false, error: "encryption_key_missing" },
      { status: 503 },
    );
  }

  const state = await buildOAuthState(id);
  const authUrl = buildGscAuthUrl(state);

  return NextResponse.json({ ok: true, authUrl });
}
