import { readFileSync } from "fs";
import { join } from "path";

import {
  getOnboardingPublicBaseUrl,
  getOnboardingSupportEmail,
} from "@/lib/onboarding-env";
import { buildPortalAccessUrl } from "@/lib/portal-access";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ampersandForHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;");
}

let cachedTemplate: string | null = null;

function loadTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const path = join(
    process.cwd(),
    "src/lib/email-templates/team-member-welcome-es.html",
  );
  cachedTemplate = readFileSync(path, "utf8");
  return cachedTemplate;
}

const ACCESS_LABELS_ES: Record<string, string> = {
  notion: "Notion",
  cms: "CMS",
  ops: "Panel de operaciones",
};

export function formatAccessLabelsEs(accesses: string[]): string[] {
  return accesses
    .map((a) => ACCESS_LABELS_ES[a])
    .filter((v): v is string => typeof v === "string");
}

function buildSignedPortalUrl(slug: string, email: string): string {
  // The `/enter` route verifies the HMAC, re-checks the allowlist, drops a
  // 30-day session cookie, and redirects to `/client/<slug>`. No Supabase,
  // no OTP round-trip — the welcome email link is the login.
  return buildPortalAccessUrl(getOnboardingPublicBaseUrl(), slug, email);
}

type WelcomeVars = {
  preheader: string;
  headline: string;
  clientName: string;
  projectName: string;
  ctaUrl: string;
  supportEmail: string;
  accessListHtml: string;
};

function renderTemplate(vars: WelcomeVars): string {
  const html = loadTemplate();
  const map: Record<string, string> = {
    PREHEADER: escapeHtml(vars.preheader),
    HEADLINE: escapeHtml(vars.headline),
    CLIENT_NAME: escapeHtml(vars.clientName),
    PROJECT_NAME: escapeHtml(vars.projectName),
    CTA_URL: ampersandForHtmlAttr(vars.ctaUrl),
    SUPPORT_EMAIL: escapeHtml(vars.supportEmail),
    ACCESS_LIST: vars.accessListHtml,
  };
  let out = html;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(`{{{${key}}}}`).join(value);
  }
  return out;
}

function buildTextFallback(vars: WelcomeVars, labels: string[]): string {
  return [
    vars.headline,
    "",
    `Hola,`,
    `${vars.clientName} te agregó al equipo del proyecto ${vars.projectName}.`,
    `Accesos habilitados: ${labels.join(", ") || "—"}.`,
    "",
    "Entra a tu portal:",
    vars.ctaUrl,
    "",
    `Dudas: ${vars.supportEmail}.`,
    "",
    "Equipo MenteMaestra",
  ].join("\n");
}

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
    console.error("[team-member-welcome] Resend error", res.status, errText);
    return false;
  }
  return true;
}

export type SendTeamMemberWelcomeInput = {
  to: string;
  projectName: string;
  projectSlug: string;
  clientName: string;
  accesses: string[];
};

export async function sendTeamMemberWelcomeEmail(
  input: SendTeamMemberWelcomeInput,
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !resendFrom) {
    console.warn(
      "[team-member-welcome] Resend not configured; skipping welcome email",
    );
    return false;
  }

  const supportEmail = getOnboardingSupportEmail();
  const ctaUrl = buildSignedPortalUrl(input.projectSlug, input.to);
  const labels = formatAccessLabelsEs(input.accesses);
  const accessListHtml =
    labels.length > 0
      ? labels.map((l) => escapeHtml(l)).join(" · ")
      : escapeHtml("Sin accesos especificados");

  const vars: WelcomeVars = {
    preheader: `Te invitaron al proyecto ${input.projectName} en MenteMaestra`.slice(
      0,
      140,
    ),
    headline: `Acceso a ${input.projectName}`,
    clientName: input.clientName,
    projectName: input.projectName,
    ctaUrl,
    supportEmail,
    accessListHtml,
  };

  let html: string | undefined;
  try {
    html = renderTemplate(vars);
  } catch (err) {
    console.error("[team-member-welcome] render failed", err);
  }
  const text = buildTextFallback(vars, labels);
  const subject = `Te invitaron al proyecto ${input.projectName} en MenteMaestra`;

  return postResendEmail(resendKey, {
    from: resendFrom,
    to: [input.to],
    subject,
    text,
    ...(html ? { html } : {}),
  });
}
