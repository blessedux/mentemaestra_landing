import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/lib/db";
import {
  getInviteByTokenHash,
  recordSubmissionAndConsumeInvite,
} from "@/lib/onboarding-invite-store";
import {
  hashInviteToken,
  isPlausibleInviteToken,
} from "@/lib/onboarding-token";
import {
  PUBLIC_POST_LIMIT,
  PUBLIC_POST_WINDOW_MS,
  clientIpFromHeaders,
  takeToken,
} from "@/lib/onboarding-rate-limit";
import { applyPortalSessionCookie } from "@/lib/portal-access";
import { sendTeamMemberWelcomeEmail } from "@/lib/team-member-welcome-email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && EMAIL_RE.test(v.trim());
}

type RouteContext = { params: Promise<{ token: string }> };

async function resolveToken(ctx: RouteContext): Promise<string | null> {
  const { token } = await ctx.params;
  if (!token || !isPlausibleInviteToken(token)) return null;
  return token;
}

type InviteStatus = "ok" | "not_found" | "used" | "expired";

function inviteStatus(row: {
  used_at: string | null;
  expires_at: string;
}): InviteStatus {
  if (row.used_at) return "used";
  if (new Date(row.expires_at).getTime() <= Date.now()) return "expired";
  return "ok";
}

export async function GET(_req: Request, ctx: RouteContext) {
  const token = await resolveToken(ctx);
  if (!token) {
    return NextResponse.json(
      { ok: false, status: "not_found" },
      { status: 404 },
    );
  }

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

  const row = await getInviteByTokenHash(sql, hashInviteToken(token));
  if (!row) {
    return NextResponse.json(
      { ok: false, status: "not_found" },
      { status: 404 },
    );
  }

  const status = inviteStatus(row);
  if (status !== "ok") {
    return NextResponse.json(
      { ok: false, status },
      { status: 410 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: "ok",
    project: {
      id: row.project_id,
      slug: row.project_slug,
      name: row.project_name,
      notion_url: row.project_notion_url,
    },
    client: {
      name: row.client_name,
    },
    invite: {
      sent_to_email: row.sent_to_email,
      expires_at: row.expires_at,
    },
  });
}

const ACCESS_VALUES = ["notion", "cms", "ops"] as const;
type AccessKey = (typeof ACCESS_VALUES)[number];
const ACCESS_SET = new Set<string>(ACCESS_VALUES);

type StakeholderEntry = { email: string; accesses: AccessKey[] };

type SubmissionBody = {
  admin_email: string;
  stakeholders: StakeholderEntry[];
};

function parseStakeholders(raw: unknown): StakeholderEntry[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return [];
  if (raw.length > 20) return null;
  const out: StakeholderEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const email = (entry as { email?: unknown }).email;
    const accesses = (entry as { accesses?: unknown }).accesses;
    if (!isValidEmail(email)) return null;
    if (!Array.isArray(accesses)) return null;
    const clean: AccessKey[] = [];
    for (const a of accesses) {
      if (typeof a !== "string") return null;
      if (!ACCESS_SET.has(a)) return null;
      if (!clean.includes(a as AccessKey)) clean.push(a as AccessKey);
    }
    if (clean.length === 0) return null;
    out.push({ email: email.trim(), accesses: clean });
  }
  return out;
}

export async function POST(req: Request, ctx: RouteContext) {
  const token = await resolveToken(ctx);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 404 },
    );
  }

  // Same-origin guard: reject when the browser sends an Origin that points to
  // a different host than the one it's POSTing to. Compare hosts (not full
  // origins) so http/https or Next's rewritten `req.url` in dev with
  // `-H 0.0.0.0` / reverse proxies don't trigger false positives.
  const originHeader = req.headers.get("origin");
  if (originHeader) {
    let originHost: string | null = null;
    try {
      originHost = new URL(originHeader).host.toLowerCase();
    } catch {
      originHost = null;
    }
    const hostHeader = req.headers.get("host")?.toLowerCase() ?? null;
    if (!originHost || !hostHeader || originHost !== hostHeader) {
      return NextResponse.json(
        { ok: false, error: "bad_origin" },
        { status: 403 },
      );
    }
  }

  const ip = clientIpFromHeaders(req.headers);
  const gate = takeToken(`client-access:${ip}`);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        limit: PUBLIC_POST_LIMIT,
        windowMs: PUBLIC_POST_WINDOW_MS,
      },
      {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSeconds) },
      },
    );
  }

  let body: SubmissionBody;
  try {
    body = (await req.json()) as SubmissionBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!isValidEmail(body.admin_email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_admin_email" },
      { status: 400 },
    );
  }
  const stakeholders = parseStakeholders(body.stakeholders);
  if (stakeholders === null) {
    return NextResponse.json(
      { ok: false, error: "invalid_stakeholders" },
      { status: 400 },
    );
  }

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

  const invite = await getInviteByTokenHash(sql, hashInviteToken(token));
  if (!invite) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }
  const status = inviteStatus(invite);
  if (status !== "ok") {
    return NextResponse.json({ ok: false, error: status }, { status: 410 });
  }

  const adminEmail = body.admin_email.trim();
  const result = await recordSubmissionAndConsumeInvite(sql, {
    invite_id: invite.id,
    admin_email: adminEmail,
    stakeholders,
  });

  if (!result.ok) {
    const httpStatus = result.error === "already_submitted" ? 409 : 410;
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: httpStatus },
    );
  }

  // Fire-and-forget welcome emails. Resend failures must not fail the submit
  // because the DB is already consistent.
  const welcomeRecipients = [
    { email: adminEmail, accesses: ["notion", "cms", "ops"] as string[] },
    ...stakeholders.map((s) => ({
      email: s.email,
      accesses: s.accesses as string[],
    })),
  ];
  await Promise.all(
    welcomeRecipients.map(async ({ email, accesses }) => {
      try {
        await sendTeamMemberWelcomeEmail({
          to: email,
          projectName: invite.project_name,
          projectSlug: invite.project_slug,
          clientName: invite.client_name,
          accesses,
        });
      } catch (err) {
        console.error("[client-access] welcome email failed", email, err);
      }
    }),
  );

  const res = NextResponse.json({
    ok: true,
    submission_id: result.submission_id,
    project_slug: invite.project_slug,
  });
  // Session cookie on this response so the admin’s browser is logged in when
  // the client follows up with a client-side navigation to the portal.
  try {
    applyPortalSessionCookie(res, invite.project_slug, adminEmail);
  } catch (err) {
    console.error("[client-access] applyPortalSessionCookie failed", err);
    // Non-fatal: the admin can still click their welcome email link.
  }
  return res;
}
