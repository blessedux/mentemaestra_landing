import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import {
  addStakeholder,
  getLatestSubmissionForProject,
  getProjectWithClientById,
  removeStakeholder,
  updateStakeholder,
  type MemberMutationResult,
  type StakeholderInput,
} from "@/lib/onboarding-invite-store";
import { sendTeamMemberWelcomeEmail } from "@/lib/team-member-welcome-email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_VALUES = ["notion", "cms", "ops"] as const;
type Params = { params: Promise<{ id: string }> };

function guard(sql: ReturnType<typeof getDb> | null) {
  if (!hasDatabase() || !sql) {
    return NextResponse.json(
      { ok: false, error: "database_not_configured" },
      { status: 503 },
    );
  }
  return null;
}

function parseStakeholder(body: unknown): StakeholderInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { email?: unknown; accesses?: unknown };
  if (typeof b.email !== "string" || !EMAIL_RE.test(b.email.trim())) {
    return null;
  }
  if (!Array.isArray(b.accesses)) return null;
  const accesses: string[] = [];
  for (const a of b.accesses) {
    if (typeof a !== "string") return null;
    if (!(ACCESS_VALUES as readonly string[]).includes(a)) return null;
    if (!accesses.includes(a)) accesses.push(a);
  }
  if (accesses.length === 0) return null;
  return { email: b.email.trim(), accesses };
}

function mutationStatus(reason: Exclude<MemberMutationResult, { ok: true }>["reason"]): number {
  switch (reason) {
    case "no_submission":
      return 409;
    case "duplicate":
      return 409;
    case "not_found":
      return 404;
    case "invalid_accesses":
      return 400;
    default:
      return 400;
  }
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const sql = hasDatabase() ? getDb() : null;
  const g = guard(sql);
  if (g) return g;
  if (!sql) return g!;
  const sub = await getLatestSubmissionForProject(sql, id);
  if (!sub) {
    return NextResponse.json({ ok: true, ready: false });
  }
  return NextResponse.json({
    ok: true,
    ready: true,
    admin_email: sub.admin_email,
    stakeholders: sub.stakeholders,
    submitted_at: sub.submitted_at,
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const sql = hasDatabase() ? getDb() : null;
  const g = guard(sql);
  if (g) return g;
  if (!sql) return g!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  const input = parseStakeholder(body);
  if (!input) {
    return NextResponse.json(
      { ok: false, error: "invalid_stakeholder" },
      { status: 400 },
    );
  }

  const project = await getProjectWithClientById(sql, id);
  if (!project) {
    return NextResponse.json(
      { ok: false, error: "project_not_found" },
      { status: 404 },
    );
  }

  const result = await addStakeholder(sql, id, input);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: mutationStatus(result.reason) },
    );
  }

  // Fire-and-forget welcome email; Resend failures must not block the write.
  let emailSent = false;
  try {
    emailSent = await sendTeamMemberWelcomeEmail({
      to: input.email,
      projectName: project.name,
      projectSlug: project.slug,
      clientName: project.client_name,
      accesses: input.accesses,
    });
  } catch (err) {
    console.error("[internal/members] welcome email failed", err);
  }

  return NextResponse.json({
    ok: true,
    stakeholders: result.stakeholders,
    email_sent: emailSent,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const sql = hasDatabase() ? getDb() : null;
  const g = guard(sql);
  if (g) return g;
  if (!sql) return g!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  const input = parseStakeholder(body);
  if (!input) {
    return NextResponse.json(
      { ok: false, error: "invalid_stakeholder" },
      { status: 400 },
    );
  }

  const result = await updateStakeholder(sql, id, input);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: mutationStatus(result.reason) },
    );
  }
  return NextResponse.json({ ok: true, stakeholders: result.stakeholders });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const sql = hasDatabase() ? getDb() : null;
  const g = guard(sql);
  if (g) return g;
  if (!sql) return g!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  const email =
    body && typeof body === "object"
      ? (body as { email?: unknown }).email
      : undefined;
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const result = await removeStakeholder(sql, id, email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: mutationStatus(result.reason) },
    );
  }
  return NextResponse.json({ ok: true, stakeholders: result.stakeholders });
}
