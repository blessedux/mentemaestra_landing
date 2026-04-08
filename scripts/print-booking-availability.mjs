#!/usr/bin/env node
/**
 * Calls GET /api/booking-availability on local dev (default http://127.0.0.1:3000).
 * Run `pnpm dev` first, then: pnpm booking:availability
 */
const base =
  process.env.BOOKING_AVAILABILITY_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3000";

function monthRangeUtc(y, m0) {
  const from = `${y}-${String(m0 + 1).padStart(2, "0")}-01`;
  const last = new Date(y, m0 + 1, 0).getDate();
  const to = `${y}-${String(m0 + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

const debug = process.argv.includes("--debug");
const now = new Date();
const { from, to } = monthRangeUtc(now.getFullYear(), now.getMonth());
const url = `${base}/api/booking-availability?from=${from}&to=${to}${
  debug ? "&debug=1" : ""
}`;

const res = await fetch(url);
const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("Non-JSON response:", text.slice(0, 500));
  process.exit(1);
}

const slots = json.availableSlotsByDate || {};
const totalSlots = Object.values(slots).reduce((n, arr) => n + arr.length, 0);

const out = {
  url,
  ok: res.ok,
  timezone: json.timezone,
  databaseConfigured: json.databaseConfigured,
  databaseConnected: json.databaseConnected,
  databaseIssue: json.databaseIssue,
  caldavConfigured: json.caldavConfigured,
  caldavOk: json.caldavOk,
  caldavError: json.caldavError,
  weekdaysWithAvailability: Object.keys(slots).length,
  totalOpenSlotStarts: totalSlots,
};
if (debug && json._debug) out.debug = json._debug;
console.log(JSON.stringify(out, null, 2));
