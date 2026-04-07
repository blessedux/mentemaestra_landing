import { DateTime } from "luxon";
import { DAVClient } from "tsdav";

import { TIME_SLOTS } from "@/lib/booking-slots";

export function isIcloudCaldavEnabled(): boolean {
  return (
    process.env.BOOKING_ICLOUD_CALDAV_ENABLED === "true" &&
    Boolean(process.env.ICLOUD_APPLE_ID?.trim()) &&
    Boolean(process.env.ICLOUD_APP_SPECIFIC_PASSWORD?.trim())
  );
}

async function createClient(): Promise<DAVClient> {
  const client = new DAVClient({
    serverUrl: "https://caldav.icloud.com/",
    credentials: {
      username: process.env.ICLOUD_APPLE_ID!.trim(),
      password: process.env.ICLOUD_APP_SPECIFIC_PASSWORD!.trim(),
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await client.login();
  return client;
}

async function resolveTargetCalendar(client: DAVClient) {
  const calendars = await client.fetchCalendars();
  const exactUrl = process.env.ICLOUD_CALDAV_CALENDAR_URL?.trim();
  if (exactUrl) {
    const hit = calendars.find(
      (c) => c.url === exactUrl || c.url.startsWith(exactUrl),
    );
    if (hit) return hit;
  }
  const byName = process.env.ICLOUD_CALDAV_CALENDAR_NAME?.trim();
  if (byName) {
    const hit = calendars.find((c) => {
      const dn = c.displayName;
      if (typeof dn === "string") return dn === byName;
      return false;
    });
    if (hit) return hit;
  }
  return calendars[0] ?? null;
}

type BusyInterval = { start: DateTime; end: DateTime };

function parseIcalDateValue(
  propLine: string,
  value: string,
  fallbackZone: string,
): DateTime | null {
  const tzMatch = /TZID=([^;:]+)/.exec(propLine);
  const zone = tzMatch ? tzMatch[1] : fallbackZone;
  if (value.length === 8 && /^\d{8}$/.test(value)) {
    return DateTime.fromFormat(value, "yyyyLLdd", { zone }).startOf("day");
  }
  const clean = value.replace(/Z$/, "");
  if (/^\d{8}T\d{6}$/.test(clean)) {
    const iso = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}`;
    if (propLine.includes("Z")) {
      return DateTime.fromISO(`${iso}Z`, { zone: "utc" });
    }
    return DateTime.fromISO(iso, { zone });
  }
  if (value.endsWith("Z")) {
    return DateTime.fromISO(value, { zone: "utc" });
  }
  const dt = DateTime.fromISO(value, { zone });
  return dt.isValid ? dt : null;
}

function extractIntervalsFromICal(ical: string, fallbackZone: string): BusyInterval[] {
  const intervals: BusyInterval[] = [];
  const events = ical.split(/BEGIN:VEVENT/i).slice(1);
  for (const chunk of events) {
    const block = chunk.split(/END:VEVENT/i)[0] ?? chunk;
    const lines: string[] = [];
    let carry = "";
    for (const raw of block.split(/\r?\n/)) {
      if (raw.startsWith(" ") || raw.startsWith("\t")) {
        carry += raw.slice(1);
        continue;
      }
      if (carry) lines.push(carry);
      carry = raw;
    }
    if (carry) lines.push(carry);

    let dtStartLine = "";
    let dtStartVal = "";
    let dtEndLine = "";
    let dtEndVal = "";
    let durationMin: number | null = null;
    for (const line of lines) {
      if (line.startsWith("DTSTART")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        dtStartLine = line.slice(0, i);
        dtStartVal = line.slice(i + 1);
      } else if (line.startsWith("DTEND")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        dtEndLine = line.slice(0, i);
        dtEndVal = line.slice(i + 1);
      } else if (line.startsWith("DURATION:")) {
        const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(line.slice("DURATION:".length));
        if (m) {
          const h = m[1] ? Number(m[1]) : 0;
          const mm = m[2] ? Number(m[2]) : 0;
          durationMin = h * 60 + mm;
        }
      }
    }
    if (!dtStartVal) continue;
    const start = parseIcalDateValue(dtStartLine, dtStartVal, fallbackZone);
    if (!start) continue;
    let end: DateTime | null = null;
    if (dtEndVal) {
      end = parseIcalDateValue(dtEndLine, dtEndVal, fallbackZone);
    } else if (durationMin != null) {
      end = start.plus({ minutes: durationMin });
    } else {
      end = start.plus({ hours: 1 });
    }
    if (!end || !end.isValid) continue;
    intervals.push({ start, end: end > start ? end : start.plus({ minutes: 15 }) });
  }
  return intervals;
}

function slotOverlaps(
  slotStart: DateTime,
  slotEnd: DateTime,
  busy: BusyInterval,
): boolean {
  return slotStart < busy.end && busy.start < slotEnd;
}

function intervalsToBusySlots(
  intervals: BusyInterval[],
  fromYmd: string,
  toYmd: string,
  bookingTimezone: string,
): Record<string, string[]> {
  const busyByDate: Record<string, Set<string>> = {};
  let d = DateTime.fromISO(fromYmd, { zone: bookingTimezone });
  const end = DateTime.fromISO(toYmd, { zone: bookingTimezone });
  while (d <= end) {
    const ymd = d.toISODate()!;
    const wd = d.weekday;
    if (wd === 6 || wd === 7) {
      d = d.plus({ days: 1 });
      continue;
    }
    for (const hm of TIME_SLOTS) {
      const slotStart = DateTime.fromISO(`${ymd}T${hm}:00`, {
        zone: bookingTimezone,
      });
      const slotEnd = slotStart.plus({ minutes: 15 });
      for (const inv of intervals) {
        if (slotOverlaps(slotStart, slotEnd, inv)) {
          if (!busyByDate[ymd]) busyByDate[ymd] = new Set();
          busyByDate[ymd].add(hm);
          break;
        }
      }
    }
    d = d.plus({ days: 1 });
  }
  const out: Record<string, string[]> = {};
  for (const [date, set] of Object.entries(busyByDate)) {
    out[date] = [...set].sort();
  }
  return out;
}

export async function fetchIcloudBusyByDate(opts: {
  fromYmd: string;
  toYmd: string;
  bookingTimezone: string;
}): Promise<
  | { ok: true; busyByDate: Record<string, string[]> }
  | { ok: false; busyByDate: Record<string, never>; error: string }
> {
  if (!isIcloudCaldavEnabled()) {
    return { ok: true, busyByDate: {} };
  }
  try {
    const client = await createClient();
    const calendar = await resolveTargetCalendar(client);
    if (!calendar) {
      return { ok: false, busyByDate: {}, error: "no_calendar" };
    }
    const startUtc = DateTime.fromISO(opts.fromYmd, {
      zone: opts.bookingTimezone,
    })
      .startOf("day")
      .toUTC();
    const endUtc = DateTime.fromISO(opts.toYmd, {
      zone: opts.bookingTimezone,
    })
      .endOf("day")
      .toUTC();

    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: {
        start: startUtc.toISO()!,
        end: endUtc.toISO()!,
      },
      expand: true,
    });

    const allIntervals: BusyInterval[] = [];
    for (const obj of objects) {
      const raw = typeof obj.data === "string" ? obj.data : String(obj.data ?? "");
      if (!raw.includes("VEVENT")) continue;
      allIntervals.push(
        ...extractIntervalsFromICal(raw, opts.bookingTimezone),
      );
    }

    const busyByDate = intervalsToBusySlots(
      allIntervals,
      opts.fromYmd,
      opts.toYmd,
      opts.bookingTimezone,
    );
    return { ok: true, busyByDate };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "caldav_error";
    console.warn("[icloud-caldav] fetch busy failed", msg);
    return { ok: false, busyByDate: {}, error: msg };
  }
}

export async function pushIcloudCalendarEvent(opts: {
  icsBody: string;
  filenameBase: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isIcloudCaldavEnabled()) return { ok: false, error: "disabled" };
  try {
    const client = await createClient();
    const calendar = await resolveTargetCalendar(client);
    if (!calendar) return { ok: false, error: "no_calendar" };
    const safe = opts.filenameBase.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `${safe || "event"}.ics`;
    const res = await client.createCalendarObject({
      calendar,
      iCalString: opts.icsBody,
      filename,
    });
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "caldav_write_error";
    console.warn("[icloud-caldav] push event failed", msg);
    return { ok: false, error: msg };
  }
}
