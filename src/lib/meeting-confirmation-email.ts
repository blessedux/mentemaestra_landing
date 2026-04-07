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

function loadMeetingConfirmationTemplateEs(): string {
  if (cachedTemplate) return cachedTemplate;
  const path = join(
    process.cwd(),
    "src/lib/email-templates/meeting-confirmation-es.html",
  );
  cachedTemplate = readFileSync(path, "utf8");
  return cachedTemplate;
}

/** Resend dashboard templates use `{{{VARIABLE_KEY}}}` (triple braces). */
const RESEND_PLACEHOLDER = (key: string) => `{{{${key}}}}`;

/** `&` in URLs must be `&amp;` inside HTML attributes for valid email HTML. */
function ampersandForHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;");
}

const icsSecondaryButtonStyle =
  "display:block;padding:14px 12px;text-align:center;background-color:#1a1a1d;color:#f0f0f0!important;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;line-height:1.3;border:1px solid rgba(201,160,122,0.4);";
const icsSecondaryPillStyle =
  "display:block;padding:14px 12px;text-align:center;background-color:#1c1c1f;color:#d4d4d8!important;border-radius:12px;font-size:13px;font-weight:600;line-height:1.35;border:1px solid #333338;";

export function buildIcsSecondaryCellHtml(icsDownloadUrl: string | null): string {
  return icsDownloadUrl
    ? `<a href="${ampersandForHtmlAttr(icsDownloadUrl)}" style="${icsSecondaryButtonStyle}">Descargar .ics (Apple / Outlook)</a>`
    : `<span style="${icsSecondaryPillStyle}">Archivo .ics en este correo (adjunto)</span>`;
}

export function formatBookingSlotSpanish(
  dateYmd: string,
  timeHm: string,
  timezone: string,
): string {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const dt = new Date(y, mo - 1, d, 12, 0, 0);
  const datePart = dt.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${datePart} · ${timeHm} (${timezone})`;
}

/** Shared fields for guest + organizer (same Resend template, different copy). */
export type MeetingConfirmationEmailVars = {
  preheader: string;
  headline: string;
  bodyLine1: string;
  bodyLine2: string;
  dateTimeLine: string;
  googleCalendarUrl: string;
  icsDownloadUrl: string | null;
  siteUrl: string;
  socialInstagram: string;
  socialBehance: string;
  socialLinkedin: string;
  socialWeb: string;
};

/**
 * Declare these in the Resend template (all type: string).
 * Re-upload HTML after changing `meeting-confirmation-es.html`.
 */
export const RESEND_MEETING_CONFIRMATION_VARIABLE_KEYS = [
  "PREHEADER",
  "HEADLINE",
  "BODY_LINE_1",
  "BODY_LINE_2",
  "DATE_TIME_LINE",
  "GOOGLE_CALENDAR_URL",
  "ICS_SECONDARY_CELL",
  "SITE_URL",
  "SOCIAL_INSTAGRAM_URL",
  "SOCIAL_BEHANCE_URL",
  "SOCIAL_LINKEDIN_URL",
  "SOCIAL_WEB_URL",
] as const;

export type ResendMeetingConfirmationVariableKey =
  (typeof RESEND_MEETING_CONFIRMATION_VARIABLE_KEYS)[number];

export function buildResendMeetingConfirmationVariables(
  vars: MeetingConfirmationEmailVars,
): Record<ResendMeetingConfirmationVariableKey, string> {
  const icsSecondaryCell = buildIcsSecondaryCellHtml(vars.icsDownloadUrl);
  return {
    PREHEADER: escapeHtml(vars.preheader),
    HEADLINE: escapeHtml(vars.headline),
    BODY_LINE_1: vars.bodyLine1,
    BODY_LINE_2: vars.bodyLine2,
    DATE_TIME_LINE: escapeHtml(vars.dateTimeLine),
    GOOGLE_CALENDAR_URL: ampersandForHtmlAttr(vars.googleCalendarUrl),
    ICS_SECONDARY_CELL: icsSecondaryCell,
    SITE_URL: escapeHtml(vars.siteUrl),
    SOCIAL_INSTAGRAM_URL: ampersandForHtmlAttr(vars.socialInstagram),
    SOCIAL_BEHANCE_URL: ampersandForHtmlAttr(vars.socialBehance),
    SOCIAL_LINKEDIN_URL: ampersandForHtmlAttr(vars.socialLinkedin),
    SOCIAL_WEB_URL: ampersandForHtmlAttr(vars.socialWeb),
  };
}

/** Guest copy (Spanish). body lines allow simple &lt;br /&gt; only from trusted builder. */
export function buildGuestMeetingConfirmationVars(input: {
  guestName: string;
  dateTimeLine: string;
  googleCalendarUrl: string;
  icsDownloadUrl: string | null;
  siteUrl: string;
  socialInstagram: string;
  socialBehance: string;
  socialLinkedin: string;
  socialWeb: string;
}): MeetingConfirmationEmailVars {
  const n = escapeHtml(input.guestName);
  return {
    preheader: `Reunión confirmada — ${input.dateTimeLine}`.slice(0, 140),
    headline: "Tu reunión está confirmada",
    bodyLine1: `Hola ${n},`,
    bodyLine2:
      "Hemos registrado tu cita correctamente. Nos vemos pronto para hablar del crecimiento digital de tu negocio.",
    dateTimeLine: input.dateTimeLine,
    googleCalendarUrl: input.googleCalendarUrl,
    icsDownloadUrl: input.icsDownloadUrl,
    siteUrl: input.siteUrl,
    socialInstagram: input.socialInstagram,
    socialBehance: input.socialBehance,
    socialLinkedin: input.socialLinkedin,
    socialWeb: input.socialWeb,
  };
}

/** Organizer / internal copy (Spanish). */
export function buildOrganizerMeetingConfirmationVars(input: {
  guestName: string;
  guestEmail: string;
  company: string | null;
  message: string | null;
  dateTimeLine: string;
  googleCalendarUrl: string;
  icsDownloadUrl: string | null;
  siteUrl: string;
  socialInstagram: string;
  socialBehance: string;
  socialLinkedin: string;
  socialWeb: string;
}): MeetingConfirmationEmailVars {
  const name = escapeHtml(input.guestName);
  const em = escapeHtml(input.guestEmail);
  const parts = [
    `${name} · ${em}`,
    input.company?.trim()
      ? `Empresa: ${escapeHtml(input.company.trim())}`
      : null,
    input.message?.trim()
      ? `Notas: ${escapeHtml(input.message.trim())}`
      : null,
  ].filter(Boolean);
  const body2 = parts.join("<br />");
  return {
    preheader:
      `Nueva reserva — ${input.guestName} · ${input.dateTimeLine}`.slice(
        0,
        140,
      ),
    headline: "Nueva reunión exploratoria",
    bodyLine1: "Tienes una nueva reserva confirmada en el sitio.",
    bodyLine2: body2,
    dateTimeLine: input.dateTimeLine,
    googleCalendarUrl: input.googleCalendarUrl,
    icsDownloadUrl: input.icsDownloadUrl,
    siteUrl: input.siteUrl,
    socialInstagram: input.socialInstagram,
    socialBehance: input.socialBehance,
    socialLinkedin: input.socialLinkedin,
    socialWeb: input.socialWeb,
  };
}

function applyMeetingConfirmationPlaceholders(
  html: string,
  map: Record<string, string>,
): string {
  let out = html;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(RESEND_PLACEHOLDER(key)).join(value);
  }
  return out;
}

/** Renders the local HTML file (same markup as uploaded to Resend). */
export function renderMeetingConfirmationEmailEs(
  vars: MeetingConfirmationEmailVars,
): string {
  let html = loadMeetingConfirmationTemplateEs();
  const v = buildResendMeetingConfirmationVariables(vars);
  const map: Record<string, string> = {
    PREHEADER: v.PREHEADER,
    HEADLINE: v.HEADLINE,
    BODY_LINE_1: v.BODY_LINE_1,
    BODY_LINE_2: v.BODY_LINE_2,
    DATE_TIME_LINE: v.DATE_TIME_LINE,
    GOOGLE_CALENDAR_URL: v.GOOGLE_CALENDAR_URL,
    ICS_SECONDARY_CELL: v.ICS_SECONDARY_CELL,
    SITE_URL: v.SITE_URL,
    SOCIAL_INSTAGRAM_URL: v.SOCIAL_INSTAGRAM_URL,
    SOCIAL_BEHANCE_URL: v.SOCIAL_BEHANCE_URL,
    SOCIAL_LINKEDIN_URL: v.SOCIAL_LINKEDIN_URL,
    SOCIAL_WEB_URL: v.SOCIAL_WEB_URL,
  };
  return applyMeetingConfirmationPlaceholders(html, map);
}

/** @deprecated use RESEND_MEETING_CONFIRMATION_VARIABLE_KEYS */
export const RESEND_GUEST_MEETING_VARIABLE_KEYS =
  RESEND_MEETING_CONFIRMATION_VARIABLE_KEYS;
