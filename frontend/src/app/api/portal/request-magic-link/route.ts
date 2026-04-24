import { NextResponse } from "next/server";

import { listPortalProjectsForEmail } from "@/lib/client-allowlist";
import { getDb, hasDatabase } from "@/lib/db";
import { sendPortalMagicLinkEmail } from "@/lib/portal-magic-link-email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Landing-site recovery: email → magic link for every project roster that
 * includes the address (latest submission). Response is always generic.
 */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  } catch {
    return genericOk();
  }

  if (!EMAIL_RE.test(email)) {
    return genericOk();
  }

  if (!hasDatabase()) {
    return genericOk();
  }
  const sql = getDb();
  if (!sql) {
    return genericOk();
  }

  const projects = await listPortalProjectsForEmail(sql, email);
  for (const p of projects) {
    const sent = await sendPortalMagicLinkEmail({
      to: email,
      slug: p.slug,
      projectName: p.name,
    });
    if (!sent) {
      console.error("[portal/request-magic-link] email delivery failed", {
        slug: p.slug,
      });
    }
  }

  return genericOk();
}

function genericOk() {
  return NextResponse.json({
    ok: true,
    message:
      "Si tu correo está autorizado en algún proyecto, te enviamos un enlace en unos minutos. Revisa la bandeja y el spam.",
  });
}
