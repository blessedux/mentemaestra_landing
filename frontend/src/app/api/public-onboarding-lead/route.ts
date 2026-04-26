import { NextResponse } from "next/server";

import {
  buildOnboardingLeadText,
  buildOnboardingLeadVars,
  renderOnboardingLeadEmailEs,
} from "@/lib/onboarding-lead-email";

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
    console.error("[public-onboarding-lead] Resend error", res.status, errText);
    return false;
  }
  return true;
}

type Body = {
  name?: string;
  email?: string;
  answers?: {
    project?: string;
    timeline?: string;
    budget?: string;
  };
  recommendation?: unknown;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const name = body.name?.trim() || "";
  const email = body.email?.trim() || "";
  if (!name || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_fields" },
      { status: 400 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const notifyTo =
    process.env.ONBOARDING_LEAD_NOTIFY_EMAIL?.trim() ||
    process.env.BOOKING_ORGANIZER_EMAIL?.trim();

  if (!resendKey || !resendFrom || !notifyTo) {
    return NextResponse.json(
      { ok: false, error: "email_not_configured" },
      { status: 503 },
    );
  }

  const answers = body.answers ?? {};
  const vars = buildOnboardingLeadVars({
    leadName: name,
    leadEmail: email,
    project: String(answers.project ?? "unknown"),
    timeline: String(answers.timeline ?? "unknown"),
    budget: String(answers.budget ?? "unknown"),
    recommendation: body.recommendation,
  });

  const subject = `Nuevo lead de onboarding · ${name} · ${email}`;
  const text = buildOnboardingLeadText(vars);

  let html: string | undefined;
  try {
    html = renderOnboardingLeadEmailEs(vars);
  } catch (err) {
    console.error("[public-onboarding-lead] HTML render failed", err);
  }

  const ok = await postResendEmail(resendKey, {
    from: resendFrom,
    to: [notifyTo],
    subject,
    text,
    ...(html ? { html } : {}),
  });

  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "send_failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
