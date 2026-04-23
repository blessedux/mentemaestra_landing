import { readFileSync } from "fs";
import { join } from "path";

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

function loadClientOnboardingTemplateEs(): string {
  if (cachedTemplate) return cachedTemplate;
  const path = join(
    process.cwd(),
    "src/lib/email-templates/client-onboarding-es.html",
  );
  cachedTemplate = readFileSync(path, "utf8");
  return cachedTemplate;
}

/** Resend dashboard templates use `{{{VARIABLE_KEY}}}` (triple braces). */
const RESEND_PLACEHOLDER = (key: string) => `{{{${key}}}}`;

export const RESEND_CLIENT_ONBOARDING_VARIABLE_KEYS = [
  "PREHEADER",
  "HEADLINE",
  "CLIENT_NAME",
  "PROJECT_NAME",
  "CTA_URL",
  "SUPPORT_EMAIL",
] as const;

export type ResendClientOnboardingVariableKey =
  (typeof RESEND_CLIENT_ONBOARDING_VARIABLE_KEYS)[number];

export type ClientOnboardingEmailVars = {
  preheader: string;
  headline: string;
  clientName: string;
  projectName: string;
  ctaUrl: string;
  supportEmail: string;
};

export function buildClientOnboardingVars(input: {
  clientName: string;
  projectName: string;
  ctaUrl: string;
  supportEmail: string;
}): ClientOnboardingEmailVars {
  return {
    preheader: `Acceso a tu proyecto con MenteMaestra — ${input.projectName}`.slice(
      0,
      140,
    ),
    headline: "Bienvenido a tu proyecto con MenteMaestra",
    clientName: input.clientName,
    projectName: input.projectName,
    ctaUrl: input.ctaUrl,
    supportEmail: input.supportEmail,
  };
}

export function buildResendClientOnboardingVariables(
  vars: ClientOnboardingEmailVars,
): Record<ResendClientOnboardingVariableKey, string> {
  return {
    PREHEADER: escapeHtml(vars.preheader),
    HEADLINE: escapeHtml(vars.headline),
    CLIENT_NAME: escapeHtml(vars.clientName),
    PROJECT_NAME: escapeHtml(vars.projectName),
    CTA_URL: ampersandForHtmlAttr(vars.ctaUrl),
    SUPPORT_EMAIL: escapeHtml(vars.supportEmail),
  };
}

function applyPlaceholders(
  html: string,
  map: Record<string, string>,
): string {
  let out = html;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(RESEND_PLACEHOLDER(key)).join(value);
  }
  return out;
}

export function renderClientOnboardingEmailEs(
  vars: ClientOnboardingEmailVars,
): string {
  const html = loadClientOnboardingTemplateEs();
  const map = buildResendClientOnboardingVariables(vars);
  return applyPlaceholders(html, map);
}

export function buildClientOnboardingText(
  vars: ClientOnboardingEmailVars,
): string {
  return [
    vars.headline,
    "",
    `Hola ${vars.clientName},`,
    `Hemos preparado el espacio de trabajo para ${vars.projectName}.`,
    "Abre este enlace para compartir los correos que deben tener acceso:",
    vars.ctaUrl,
    "",
    `Este enlace caduca en 30 días. Dudas: ${vars.supportEmail}.`,
    "",
    "Equipo MenteMaestra",
  ].join("\n");
}
