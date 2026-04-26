import { readFileSync } from "fs";
import { join } from "path";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let cachedTemplate: string | null = null;

function loadOnboardingLeadTemplateEs(): string {
  if (cachedTemplate) return cachedTemplate;
  const path = join(
    process.cwd(),
    "src/lib/email-templates/onboarding-lead-es.html",
  );
  cachedTemplate = readFileSync(path, "utf8");
  return cachedTemplate;
}

/** Resend dashboard templates use `{{{VARIABLE_KEY}}}` (triple braces). */
const RESEND_PLACEHOLDER = (key: string) => `{{{${key}}}}`;

export const RESEND_ONBOARDING_LEAD_VARIABLE_KEYS = [
  "PREHEADER",
  "HEADLINE",
  "LEAD_NAME",
  "LEAD_EMAIL",
  "PROJECT",
  "TIMELINE",
  "BUDGET",
  "RECOMMENDATION_JSON",
] as const;

export type ResendOnboardingLeadVariableKey =
  (typeof RESEND_ONBOARDING_LEAD_VARIABLE_KEYS)[number];

export type OnboardingLeadEmailVars = {
  preheader: string;
  headline: string;
  leadName: string;
  leadEmail: string;
  project: string;
  timeline: string;
  budget: string;
  recommendationJson: string;
};

export function buildOnboardingLeadVars(input: {
  leadName: string;
  leadEmail: string;
  project: string;
  timeline: string;
  budget: string;
  recommendation: unknown;
}): OnboardingLeadEmailVars {
  const recommendationJson = safeJson(input.recommendation);
  return {
    preheader: `Nuevo lead de onboarding — ${input.leadName}`.slice(0, 140),
    headline: "Nuevo lead de onboarding (no agendó)",
    leadName: input.leadName,
    leadEmail: input.leadEmail,
    project: input.project,
    timeline: input.timeline,
    budget: input.budget,
    recommendationJson,
  };
}

export function buildResendOnboardingLeadVariables(
  vars: OnboardingLeadEmailVars,
): Record<ResendOnboardingLeadVariableKey, string> {
  return {
    PREHEADER: escapeHtml(vars.preheader),
    HEADLINE: escapeHtml(vars.headline),
    LEAD_NAME: escapeHtml(vars.leadName),
    LEAD_EMAIL: escapeHtml(vars.leadEmail),
    PROJECT: escapeHtml(vars.project),
    TIMELINE: escapeHtml(vars.timeline),
    BUDGET: escapeHtml(vars.budget),
    RECOMMENDATION_JSON: escapeHtml(vars.recommendationJson),
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

export function renderOnboardingLeadEmailEs(vars: OnboardingLeadEmailVars): string {
  const html = loadOnboardingLeadTemplateEs();
  const map = buildResendOnboardingLeadVariables(vars);
  return applyPlaceholders(html, map);
}

export function buildOnboardingLeadText(vars: OnboardingLeadEmailVars): string {
  return [
    vars.headline,
    "",
    `Nombre: ${vars.leadName}`,
    `Email: ${vars.leadEmail}`,
    "",
    "Selecciones:",
    `- Project: ${vars.project}`,
    `- Timeline: ${vars.timeline}`,
    `- Budget: ${vars.budget}`,
    "",
    "Recomendación (raw):",
    vars.recommendationJson,
  ].join("\n");
}

function safeJson(value: unknown): string {
  try {
    if (value === undefined) return "undefined";
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

