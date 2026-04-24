/**
 * Canonical public origin for marketing + CRM/booking links in outbound email.
 * Prefer `BOOKING_PUBLIC_BASE_URL` / `ONBOARDING_PUBLIC_BASE_URL`; see `getPublicSiteUrl`.
 */
export const MENTEMAESTRA_STUDIO_ORIGIN = "https://mentemaestra.studio";

/** Bare hostname (no protocol), for human-readable copy and ICS UID defaults. */
export const MENTEMAESTRA_STUDIO_HOSTNAME = "mentemaestra.studio";

/**
 * Rewrites legacy `mentemaestra.space` to `mentemaestra.studio` in full URLs,
 * origins, or email addresses (env typos / old Resend templates).
 */
export function rewriteLegacyMentemaestraHost(input: string): string {
  return input.replace(/mentemaestra\.space/gi, "mentemaestra.studio");
}
