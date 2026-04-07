import { DateTime } from "luxon";

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export type CalendarMethod = "REQUEST" | "PUBLISH";

export function buildExploratoryIcs(opts: {
  uid: string;
  date: string;
  time: string;
  timezone: string;
  summary: string;
  description: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  durationMinutes?: number;
  /** iCalendar METHOD; REQUEST works best for Mail / Apple Calendar invites. */
  calendarMethod?: CalendarMethod;
  /** Second attendee line (optional). */
  sequence?: number;
}): string {
  const duration = opts.durationMinutes ?? 45;
  const start = DateTime.fromISO(`${opts.date}T${opts.time}`, {
    zone: opts.timezone,
  });
  if (!start.isValid) {
    throw new Error("invalid_slot_datetime");
  }
  const end = start.plus({ minutes: duration });
  const stamp = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const dtStart = start.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const dtEnd = end.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const method = opts.calendarMethod ?? "REQUEST";
  const seq = opts.sequence ?? 0;

  const attendee = `ATTENDEE;CN=${escapeIcsText(opts.attendeeName)};PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${opts.attendeeEmail}`;

  const veventLines =
    method === "REQUEST"
      ? [
          "BEGIN:VEVENT",
          `UID:${opts.uid}`,
          `DTSTAMP:${stamp}`,
          `SEQUENCE:${seq}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${escapeIcsText(opts.summary)}`,
          `DESCRIPTION:${escapeIcsText(opts.description)}`,
          `ORGANIZER;CN=MenteMaestra:mailto:${opts.organizerEmail}`,
          attendee,
          "STATUS:CONFIRMED",
          "TRANSP:OPAQUE",
          "END:VEVENT",
        ]
      : [
          "BEGIN:VEVENT",
          `UID:${opts.uid}`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${escapeIcsText(opts.summary)}`,
          `DESCRIPTION:${escapeIcsText(opts.description)}`,
          `ORGANIZER;CN=MenteMaestra:mailto:${opts.organizerEmail}`,
          `ATTENDEE;CN=${escapeIcsText(opts.attendeeName)};RSVP=TRUE:mailto:${opts.attendeeEmail}`,
          "STATUS:TENTATIVE",
          "TRANSP:OPAQUE",
          "END:VEVENT",
        ];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MenteMaestra//Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    ...veventLines,
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
