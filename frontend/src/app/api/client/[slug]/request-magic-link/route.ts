import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import {
  getAllowlistForProject,
  getProjectBySlug,
} from "@/lib/client-allowlist";
import { sendPortalMagicLinkEmail } from "@/lib/portal-magic-link-email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Self-service “email me a magic link” for an allowlisted address.
 * Response is always generic (no email enumeration).
 */
export async function POST(req: Request, ctx: RouteContext) {
  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

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

  const project = await getProjectBySlug(sql, slug);
  if (!project) {
    return genericOk();
  }

  const allow = await getAllowlistForProject(sql, project.id);
  if (!allow.ready || !allow.emails.includes(email)) {
    return genericOk();
  }

  const sent = await sendPortalMagicLinkEmail({
    to: email,
    slug,
    projectName: project.name,
  });
  if (!sent) {
    console.error("[request-magic-link] email delivery failed", { slug });
  }

  return genericOk();
}

function genericOk() {
  return NextResponse.json({
    ok: true,
    message:
      "Si tu correo está autorizado para este proyecto, te enviamos un enlace en unos minutos. Revisa la bandeja y el spam.",
  });
}
