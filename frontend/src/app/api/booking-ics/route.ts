import { NextResponse } from "next/server";

import { getBookingTimezone } from "@/lib/booking-env";
import { getBookingById } from "@/lib/bookings-store";
import { getDb } from "@/lib/db";
import { buildExploratoryIcs } from "@/lib/ics";
import { verifyIcsDownloadToken } from "@/lib/ics-download-token";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const e = searchParams.get("e");
  const sig = searchParams.get("sig");
  if (!id || !e || !sig) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const exp = Number(e);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if (!verifyIcsDownloadToken(id, exp, sig)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "server" }, { status: 503 });
  }

  const row = await getBookingById(sql, id);
  if (!row || row.status === "cancelled") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const organizerEmail = process.env.BOOKING_ORGANIZER_EMAIL?.trim();
  if (!organizerEmail) {
    return NextResponse.json({ error: "server" }, { status: 503 });
  }

  const tz = getBookingTimezone();
  const timeHm = row.start_hm.trim().slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(timeHm)) {
    return NextResponse.json({ error: "invalid" }, { status: 500 });
  }

  const summary = `Exploratory — ${row.guest_name}`;
  const descParts = [
    `Guest: ${row.guest_name} <${row.guest_email}>`,
    row.company?.trim() ? `Company: ${row.company}` : "",
    row.message?.trim() ? `Notes: ${row.message}` : "",
    "",
    "Booked via mentemaestra.studio — add to your calendar from this invite.",
  ].filter(Boolean);

  let icsBody: string;
  try {
    icsBody = buildExploratoryIcs({
      uid: row.ics_uid,
      date: row.booked_on,
      time: timeHm,
      timezone: tz,
      summary,
      description: descParts.join("\\n"),
      organizerEmail,
      attendeeName: row.guest_name,
      attendeeEmail: row.guest_email,
      calendarMethod: "REQUEST",
      durationMinutes: row.duration_minutes,
    });
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 500 });
  }

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reunion-exploratoria.ics"',
      "Cache-Control": "no-store",
    },
  });
}
