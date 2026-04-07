import { NextResponse } from "next/server";

import {
  getBookingTimezone,
  parseBlockedDates,
  parseBusySlotsJson,
} from "@/lib/booking-env";
import { listBusySlotsInRange } from "@/lib/bookings-store";
import { getDb, hasDatabase } from "@/lib/db";
import { fetchIcloudBusyByDate } from "@/lib/icloud-caldav";
import {
  buildBaseAvailableSlotsByDate,
  mergeBusyMaps,
  subtractBusyFromAvailable,
} from "@/lib/native-availability";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmdParam(s: string | null): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromParam = parseYmdParam(searchParams.get("from"));
  const toParam = parseYmdParam(searchParams.get("to"));

  const blockedDatesArr = parseBlockedDates(process.env.BOOKING_BLOCKED_DATES);
  const blockedSet = new Set(blockedDatesArr);
  const envBusy = parseBusySlotsJson(process.env.BOOKING_BUSY_SLOTS_JSON);

  const tz = getBookingTimezone();
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = fromParam ?? ymdFromDate(defaultFrom);
  const to = toParam ?? ymdFromDate(defaultTo);

  const base = buildBaseAvailableSlotsByDate(from, to, blockedSet);
  let combinedBusy = { ...envBusy };

  const sql = getDb();
  let databaseConnected = hasDatabase();
  if (!databaseConnected) {
    console.warn(
      "[booking-availability] DATABASE_URL is not set (or empty). Add it in Vercel → Environment Variables for Production, then redeploy.",
    );
  }
  if (sql) {
    try {
      const dbBusy = await listBusySlotsInRange(sql, from, to);
      combinedBusy = mergeBusyMaps(combinedBusy, dbBusy);
    } catch (e) {
      console.error("[booking-availability] DB", e);
      databaseConnected = false;
    }
  }

  const caldav = await fetchIcloudBusyByDate({
    fromYmd: from,
    toYmd: to,
    bookingTimezone: tz,
  });
  if (caldav.ok && Object.keys(caldav.busyByDate).length > 0) {
    combinedBusy = mergeBusyMaps(combinedBusy, caldav.busyByDate);
  }

  const availableSlotsByDate = subtractBusyFromAvailable(base, combinedBusy);

  return NextResponse.json({
    source: "native" as const,
    timezone: tz,
    availableSlotsByDate,
    blockedDates: blockedDatesArr,
    databaseConnected,
    caldavOk: caldav.ok,
    caldavError: caldav.ok ? undefined : caldav.error,
  });
}
