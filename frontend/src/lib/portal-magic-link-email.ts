import { readFileSync } from "fs";
import { join } from "path";

import { getOnboardingPublicBaseUrl, getOnboardingSupportEmail } from "@/lib/onboarding-env";
import { buildPortalAccessUrl } from "@/lib/portal-access";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Encode `&` for safe use inside double-quoted HTML attributes (e.g. href). */
function ampersandForHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;");
}

let cachedTemplate: string | null = null;

function loadTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const path = join(
    process.cwd(),
    "src/lib/email-templates/portal-magic-link-es.html",
  );
  cachedTemplate = readFileSync(path, "utf8");
  return cachedTemplate;
}

type TemplateVars = {
  preheader: string;
  headline: string;
  projectName: string;
  ctaUrl: string;
  supportEmail: string;
};

function renderTemplate(vars: TemplateVars): string {
  const html = loadTemplate();
  const map: Record<string, string> = {
    PREHEADER: escapeHtml(vars.preheader),
    HEADLINE: escapeHtml(vars.headline),
    PROJECT_NAME: escapeHtml(vars.projectName),
    CTA_URL: ampersandForHtmlAttr(vars.ctaUrl),
    SUPPORT_EMAIL: escapeHtml(vars.supportEmail),
  };
  let out = html;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(`{{{${key}}}}`).join(value);
  }
  return out;
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
    console.error("[portal-magic-link] Resend error", res.status, errText);
    return false;
  }
  return true;
}

function buildTextFallback(vars: TemplateVars): string {
  return [
    vars.headline,
    "",
    "Hola,",
    "",
    `Proyecto: ${vars.projectName}`,
    "",
    "Entra al portal con este enlace:",
    vars.ctaUrl,
    "",
    `Soporte: ${vars.supportEmail}`,
    "",
    "Equipo MenteMaestra",
  ].join("\n");
}

/**
 * Sends a fresh signed `/client/.../enter?token=` link (same mechanism as the
 * welcome email). Only call after verifying the address is on the allowlist.
 */
export async function sendPortalMagicLinkEmail(input: {
  to: string;
  slug: string;
  projectName: string;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !resendFrom) {
    console.warn("[portal-magic-link] Resend not configured");
    return false;
  }

  const base = getOnboardingPublicBaseUrl().replace(/\/$/, "");
  const ctaUrl = buildPortalAccessUrl(base, input.slug, input.to);
  const supportEmail = getOnboardingSupportEmail();

  const vars: TemplateVars = {
    preheader: `Nuevo enlace para el portal de ${input.projectName}`.slice(0, 140),
    headline: `Tu enlace de acceso — ${input.projectName}`,
    projectName: input.projectName,
    ctaUrl,
    supportEmail,
  };

  let html: string | undefined;
  try {
    html = renderTemplate(vars);
  } catch (err) {
    console.error("[portal-magic-link] render failed", err);
  }
  const text = buildTextFallback(vars);
  const subject = `Tu enlace de acceso — ${input.projectName}`;

  return postResendEmail(resendKey, {
    from: resendFrom,
    to: [input.to],
    subject,
    text,
    ...(html ? { html } : {}),
  });
}
