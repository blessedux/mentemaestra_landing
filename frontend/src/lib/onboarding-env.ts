/**
 * Client onboarding CRM configuration (see docs/client-access-onboarding-crm.md).
 *
 * • `CRM_BASIC_AUTH_USER` / `CRM_BASIC_AUTH_PASS` — required in production to unlock
 *   `/internal/*` and `/api/internal/*`. `src/middleware.ts` fails closed if either is missing.
 * • `ONBOARDING_INVITE_TTL_DAYS` — invite link lifetime; default 30.
 * • `ONBOARDING_TOKEN_HASH_PEPPER` — optional secret mixed into `sha256` so a stolen DB row
 *   alone can't be brute-forced against a leaked URL format.
 * • `ONBOARDING_PUBLIC_BASE_URL` — origin used in invite URLs; falls back to
 *   `BOOKING_PUBLIC_BASE_URL` → `VERCEL_URL` → `http://localhost:3000`.
 * • `RESEND_ONBOARDING_TEMPLATE_ID` — optional Resend template id. If unset the
 *   app renders `src/lib/email-templates/client-onboarding-es.html` locally.
 *
 * Reused unchanged: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `DATABASE_URL`.
 */

import { getPublicSiteUrl, normalizeBrowserHostInOrigin } from "@/lib/public-site-url";

export const DEFAULT_ONBOARDING_INVITE_TTL_DAYS = 30;

export function getOnboardingInviteTtlDays(): number {
  const raw = process.env.ONBOARDING_INVITE_TTL_DAYS?.trim();
  if (!raw) return DEFAULT_ONBOARDING_INVITE_TTL_DAYS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || n > 365) {
    return DEFAULT_ONBOARDING_INVITE_TTL_DAYS;
  }
  return n;
}

export function getOnboardingTokenPepper(): string {
  return process.env.ONBOARDING_TOKEN_HASH_PEPPER?.trim() ?? "";
}

export function getOnboardingPublicBaseUrl(): string {
  const raw = process.env.ONBOARDING_PUBLIC_BASE_URL?.trim();
  if (raw) return normalizeBrowserHostInOrigin(raw.replace(/\/$/, ""));
  return getPublicSiteUrl();
}

export function getCrmBasicAuthCredentials(): {
  user: string;
  pass: string;
} | null {
  const user = process.env.CRM_BASIC_AUTH_USER?.trim();
  const pass = process.env.CRM_BASIC_AUTH_PASS;
  if (!user || !pass) return null;
  return { user, pass };
}

export function getOnboardingResendTemplateId(): string | null {
  const v = process.env.RESEND_ONBOARDING_TEMPLATE_ID?.trim();
  return v && v.length > 0 ? v : null;
}

export function getOnboardingSupportEmail(): string {
  return (
    process.env.ONBOARDING_SUPPORT_EMAIL?.trim() ||
    process.env.BOOKING_ORGANIZER_EMAIL?.trim() ||
    "hola@mentemaestra.studio"
  );
}
