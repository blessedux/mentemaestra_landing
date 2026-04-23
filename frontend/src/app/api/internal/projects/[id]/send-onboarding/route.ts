import { NextResponse } from "next/server";

import {
  buildClientOnboardingText,
  buildClientOnboardingVars,
  buildResendClientOnboardingVariables,
  renderClientOnboardingEmailEs,
} from "@/lib/client-onboarding-email";
import { getDb, hasDatabase } from "@/lib/db";
import {
  createInvite,
  getProjectWithClientById,
} from "@/lib/onboarding-invite-store";
import {
  getOnboardingInviteTtlDays,
  getOnboardingResendTemplateId,
  getOnboardingSupportEmail,
} from "@/lib/onboarding-env";
import {
  buildInviteUrl,
  generateInviteToken,
  hashInviteToken,
} from "@/lib/onboarding-token";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postResendEmail(
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[send-onboarding] Resend error", res.status, errText);
    return false;
  }
  return true;
}

type Body = {
  to_email?: string;
  operator?: string;
};

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
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

  const { id } = await ctx.params;

  let body: Body = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const project = await getProjectWithClientById(sql, id);
  if (!project) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  const toEmail = (body.to_email?.trim() || project.client_primary_email).trim();
  if (!EMAIL_RE.test(toEmail)) {
    return NextResponse.json(
      { ok: false, error: "invalid_to_email" },
      { status: 400 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !resendFrom) {
    return NextResponse.json(
      { ok: false, error: "resend_not_configured" },
      { status: 503 },
    );
  }

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const ttlDays = getOnboardingInviteTtlDays();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const operator = body.operator?.trim() || "operator";
  const invite = await createInvite(sql, {
    project_id: project.id,
    token_hash: tokenHash,
    sent_to_email: toEmail,
    sent_by: operator,
    expires_at: expiresAt,
  });

  const ctaUrl = buildInviteUrl(rawToken);
  const vars = buildClientOnboardingVars({
    clientName: project.client_name,
    projectName: project.name,
    ctaUrl,
    supportEmail: getOnboardingSupportEmail(),
  });

  let html: string | undefined;
  try {
    html = renderClientOnboardingEmailEs(vars);
  } catch (err) {
    console.error("[send-onboarding] HTML render failed", err);
  }
  const text = buildClientOnboardingText(vars);

  const templateId = getOnboardingResendTemplateId();
  const subject = `Acceso a tu proyecto con MenteMaestra — ${project.name}`;
  let emailSent = false;
  if (templateId) {
    emailSent = await postResendEmail(resendKey, {
      from: resendFrom,
      to: [toEmail],
      subject,
      template: {
        id: templateId,
        variables: buildResendClientOnboardingVariables(vars),
      },
    });
  } else {
    emailSent = await postResendEmail(resendKey, {
      from: resendFrom,
      to: [toEmail],
      subject,
      text,
      ...(html ? { html } : {}),
    });
  }

  return NextResponse.json({
    ok: true,
    invite: {
      id: invite.id,
      sent_to_email: invite.sent_to_email,
      sent_by: invite.sent_by,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
    },
    cta_url: ctaUrl,
    email_sent: emailSent,
  });
}
