import { DateTime } from "luxon";

/** Google Calendar “add event” URL (opens browser; works for Gmail users). */
export function buildGoogleCalendarTemplateUrl(opts: {
  title: string;
  details: string;
  dateYmd: string;
  timeHm: string;
  durationMinutes: number;
  timezone: string;
}): string {
  const start = DateTime.fromISO(`${opts.dateYmd}T${opts.timeHm}:00`, {
    zone: opts.timezone,
  });
  if (!start.isValid) {
    throw new Error("invalid_slot_datetime");
  }
  const end = start.plus({ minutes: opts.durationMinutes });
  const fmtUtc = (dt: DateTime) =>
    dt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const dates = `${fmtUtc(start)}/${fmtUtc(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    details: opts.details,
    dates,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
