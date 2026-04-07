import { DateTime } from "luxon";

import { SLOT_COUNT, TIME_SLOTS } from "@/lib/booking-slots";

export function mergeBusyMaps(
  a: Record<string, string[]>,
  b: Record<string, string[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = { ...a };
  for (const [day, slots] of Object.entries(b)) {
    out[day] = [...new Set([...(out[day] ?? []), ...slots])];
  }
  return out;
}

/** Weekday-only base availability (every TIME slot) for non-blocked weekdays in range. */
export function buildBaseAvailableSlotsByDate(
  rangeStartYmd: string,
  rangeEndYmd: string,
  blockedDates: Set<string>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  let d = DateTime.fromISO(rangeStartYmd);
  const end = DateTime.fromISO(rangeEndYmd);
  if (!d.isValid || !end.isValid) return out;

  while (d <= end) {
    const ymd = d.toISODate()!;
    const wd = d.weekday;
    if (wd !== 6 && wd !== 7 && !blockedDates.has(ymd)) {
      out[ymd] = [...TIME_SLOTS];
    }
    d = d.plus({ days: 1 });
  }
  return out;
}

export function subtractBusyFromAvailable(
  available: Record<string, string[]>,
  busy: Record<string, string[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [day, slots] of Object.entries(available)) {
    const busySet = new Set(busy[day] ?? []);
    const next = slots.filter((s) => !busySet.has(s));
    if (next.length > 0) out[day] = next;
  }
  return out;
}

export function dayFullyBooked(
  ymd: string,
  busyByDate: Record<string, string[]>,
): boolean {
  const busy = busyByDate[ymd] ?? [];
  return busy.length >= SLOT_COUNT;
}
