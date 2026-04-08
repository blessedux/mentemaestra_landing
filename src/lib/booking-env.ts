/**
 * Booking configuration (see `/api/book-meeting`, `/api/booking-availability`).
 *
 * • `DATABASE_URL` — Postgres connection string (required; run `../backend/migrations/001_bookings.sql`). **Supabase** (local dev + production): use the **transaction pooler** URI (port **6543**) with `?pgbouncer=true&sslmode=require`; `src/lib/db.ts` patches common omissions for `pooler.supabase.com`. Optional offline DB: `../backend/docker-compose.yml` on port **5433**.
 * • `BOOKING_ORGANIZER_EMAIL` — organizer mailbox for ICS + Resend (required).
 * • `BOOKING_TIMEZONE` — IANA zone for slots and ICS (default `America/Santiago`).
 * • `BOOKING_BLOCKED_DATES` — comma-separated `YYYY-MM-DD` (whole days off).
 * • `BOOKING_BUSY_SLOTS_JSON` — optional `{ "YYYY-MM-DD": ["HH:mm", ...] }` extra busy slots.
 * • `BOOKING_ICS_UID_HOST` — optional UID domain for ICS.
 * • `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — email delivery (organizer + guest get `.ics`). The **from** domain must be [verified in Resend](https://resend.com/domains); otherwise API returns 403. For quick tests only, Resend allows `onboarding@resend.dev` with recipient restrictions.
 * • `RESEND_MEETING_CONFIRMATION_TEMPLATE_ID` — optional. If set, **both** the guest and **organizer** (`BOOKING_ORGANIZER_EMAIL`) receive the same [Resend template](https://resend.com/docs/dashboard/templates/introduction) (HTML: `src/lib/email-templates/meeting-confirmation-es.html`) with different copy via variables. **`RESEND_GUEST_MEETING_TEMPLATE_ID`** is still read as a fallback alias. If neither is set, the app renders HTML locally. Declare **string** variables in Resend: `PREHEADER`, `HEADLINE`, `BODY_LINE_1`, `BODY_LINE_2`, `DATE_TIME_LINE`, `GOOGLE_CALENDAR_URL`, `ICS_SECONDARY_CELL`, `SITE_URL`, `SOCIAL_INSTAGRAM_URL`, `SOCIAL_BEHANCE_URL`, `SOCIAL_LINKEDIN_URL`, `SOCIAL_WEB_URL`. Placeholders use **triple braces** (e.g. `{{{HEADLINE}}}`). See `RESEND_MEETING_CONFIRMATION_VARIABLE_KEYS` in `meeting-confirmation-email.ts`.
 * • `BOOKING_PUBLIC_BASE_URL` — public site origin for links in emails and signed `.ics` downloads (no trailing slash), e.g. `https://mentemaestra.space`. Falls back to `VERCEL_URL` or `http://localhost:3000`.
 * • `BOOKING_ICS_DOWNLOAD_SECRET` — long random string (≥16 chars) to sign guest `.ics` download links in email; without it, the HTML email still works but the “Descargar .ics” button points to the attachment only.
 * • `BOOKING_SOCIAL_INSTAGRAM_URL`, `BOOKING_SOCIAL_BEHANCE_URL`, `BOOKING_SOCIAL_LINKEDIN_URL`, `BOOKING_SOCIAL_WEB_URL` — optional; default to `BOOKING_PUBLIC_BASE_URL` for the footer icons in the Spanish confirmation email.
 *
 * ## iCloud CalDAV (optional)
 * • `BOOKING_ICLOUD_CALDAV_ENABLED=true`
 * • `ICLOUD_APPLE_ID`, `ICLOUD_APP_SPECIFIC_PASSWORD`
 * • `ICLOUD_CALDAV_CALENDAR_URL` or `ICLOUD_CALDAV_CALENDAR_NAME` — target calendar for read (busy) + write (new events).
 * If CalDAV read fails, availability still uses the site grid + DB; check server logs.
 * A **multi-day or all-day** event that spans your booking range marks **every** 15-minute slot in that range as busy (same as being fully booked). Use `pnpm booking:availability --debug` (non-production) to inspect `largestIntervalHours` and interval samples if the grid is unexpectedly empty.
 */

export function parseBlockedDates(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
}

export function parseBusySlotsJson(
  raw: string | undefined,
): Record<string, string[]> {
  if (!raw?.trim()) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(o)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
      if (Array.isArray(v)) out[k] = v.map((x) => String(x));
    }
    return out;
  } catch {
    return {};
  }
}

export function getBookingTimezone(): string {
  const z = process.env.BOOKING_TIMEZONE?.trim();
  return z && z.length > 0 ? z : "America/Santiago";
}
