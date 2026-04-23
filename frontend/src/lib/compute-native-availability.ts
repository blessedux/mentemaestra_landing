import {
  getBookingTimezone,
  parseBlockedDates,
  parseBusySlotsJson,
} from "@/lib/booking-env";
import { listBusySlotsInRange } from "@/lib/bookings-store";
import { getDb, hasDatabase } from "@/lib/db";
import type { CaldavFetchDebug, CaldavFetchMeta } from "@/lib/icloud-caldav";
import {
  fetchIcloudBusyByDate,
  isIcloudCaldavEnabled,
} from "@/lib/icloud-caldav";
import {
  buildBaseAvailableSlotsByDate,
  mergeBusyMaps,
  subtractBusyFromAvailable,
} from "@/lib/native-availability";

function sumBusySlotStarts(busy: Record<string, string[]>): number {
  return Object.values(busy).reduce((n, arr) => n + arr.length, 0);
}

export type NativeAvailabilityDebug = {
  range: { from: string; to: string };
  baseWeekdays: number;
  baseOpenSlotStarts: number;
  envBusySlotStarts: number;
  busyAfterDbSlotStarts: number;
  caldavBusyDays: number;
  caldavBusySlotStarts: number;
  mergedBusySlotStarts: number;
  openSlotStartsAfterSubtract: number;
  caldav?: CaldavFetchDebug;
};

export type ComputeNativeAvailabilityResult = {
  timezone: string;
  availableSlotsByDate: Record<string, string[]>;
  blockedDates: string[];
  databaseConfigured: boolean;
  databaseConnected: boolean;
  caldavConfigured: boolean;
  caldavOk: boolean;
  caldavError?: string;
  caldavMeta?: CaldavFetchMeta;
  debug?: NativeAvailabilityDebug;
};

/**
 * Single source of truth for native grid + Postgres + env busy + iCloud CalDAV.
 * Used by GET /api/booking-availability and POST /api/book-meeting validation.
 */
export async function computeNativeAvailability(opts: {
  fromYmd: string;
  toYmd: string;
  /** Use only in development via `?debug=1` on the API route. */
  debug?: boolean;
}): Promise<ComputeNativeAvailabilityResult> {
  const { fromYmd: from, toYmd: to } = opts;
  const debugAvailability =
    opts.debug === true && process.env.NODE_ENV !== "production";

  const blockedDatesArr = parseBlockedDates(process.env.BOOKING_BLOCKED_DATES);
  const blockedSet = new Set(blockedDatesArr);
  const envBusy = parseBusySlotsJson(process.env.BOOKING_BUSY_SLOTS_JSON);
  const timezone = getBookingTimezone();

  const base = buildBaseAvailableSlotsByDate(from, to, blockedSet);
  let combinedBusy = { ...envBusy };
  let combinedBusyAfterDb = combinedBusy;

  const sql = getDb();
  const databaseConfigured = hasDatabase();
  let databaseConnected = false;
  if (!databaseConfigured) {
    console.warn(
      "[booking-availability] DATABASE_URL is not set (or empty). Add it in Vercel → Environment Variables for Production, then redeploy.",
    );
  } else if (sql) {
    try {
      const dbBusy = await listBusySlotsInRange(sql, from, to);
      combinedBusy = mergeBusyMaps(combinedBusy, dbBusy);
      combinedBusyAfterDb = combinedBusy;
      databaseConnected = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[booking-availability] DB query failed:", msg);
      if (/relation ["']bookings["'] does not exist/i.test(msg)) {
        console.error(
          "[booking-availability] Apply backend/migrations/001_bookings.sql to this database (Supabase SQL editor or psql).",
        );
      }
      databaseConnected = false;
    }
  }

  const caldav = await fetchIcloudBusyByDate({
    fromYmd: from,
    toYmd: to,
    bookingTimezone: timezone,
    debug: debugAvailability,
  });

  if (caldav.ok && Object.keys(caldav.busyByDate).length > 0) {
    combinedBusy = mergeBusyMaps(combinedBusy, caldav.busyByDate);
  }

  const availableSlotsByDate = subtractBusyFromAvailable(base, combinedBusy);

  const result: ComputeNativeAvailabilityResult = {
    timezone,
    availableSlotsByDate,
    blockedDates: blockedDatesArr,
    databaseConfigured,
    databaseConnected,
    caldavConfigured: isIcloudCaldavEnabled(),
    caldavOk: caldav.ok,
    caldavError: caldav.ok ? undefined : caldav.error,
    caldavMeta: caldav.ok ? caldav.caldavMeta : undefined,
  };

  if (debugAvailability) {
    result.debug = {
      range: { from, to },
      baseWeekdays: Object.keys(base).length,
      baseOpenSlotStarts: sumBusySlotStarts(base),
      envBusySlotStarts: sumBusySlotStarts(envBusy),
      busyAfterDbSlotStarts: sumBusySlotStarts(combinedBusyAfterDb),
      caldavBusyDays: Object.keys(caldav.busyByDate).length,
      caldavBusySlotStarts: sumBusySlotStarts(caldav.busyByDate),
      mergedBusySlotStarts: sumBusySlotStarts(combinedBusy),
      openSlotStartsAfterSubtract: sumBusySlotStarts(availableSlotsByDate),
      caldav:
        caldav.ok && "caldavDebug" in caldav && caldav.caldavDebug
          ? caldav.caldavDebug
          : undefined,
    };
  }

  return result;
}
