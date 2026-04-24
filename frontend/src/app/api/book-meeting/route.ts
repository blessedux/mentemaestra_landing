import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  getBookingTimezone,
  parseBlockedDates,
  parseBusySlotsJson,
} from "@/lib/booking-env";
import { TIME_SLOTS } from "@/lib/booking-slots";
import { computeNativeAvailability } from "@/lib/compute-native-availability";
import { createBooking } from "@/lib/bookings-store";
import { getDb, hasDatabase } from "@/lib/db";
import { buildGoogleCalendarTemplateUrl } from "@/lib/google-calendar-link";
import { buildExploratoryIcs } from "@/lib/ics";
import {
  canSignIcsDownloadLinks,
  icsDownloadExpirySeconds,
  signIcsDownloadToken,
} from "@/lib/ics-download-token";
import { pushIcloudCalendarEvent } from "@/lib/icloud-caldav";
import {
  buildGuestMeetingConfirmationVars,
  buildOrganizerMeetingConfirmationVars,
  buildResendMeetingConfirmationVariables,
  formatBookingSlotSpanish,
  renderMeetingConfirmationEmailEs,
} from "@/lib/meeting-confirmation-email";
import {
  MENTEMAESTRA_STUDIO_HOSTNAME,
  rewriteLegacyMentemaestraHost,
} from "@/lib/mentemaestra-public";
import { getPublicSiteUrl, getSocialUrlsForEmail } from "@/lib/public-site-url";

export const dynamic = "force-dynamic";

type Body = {
  date: string;
  time: string;
  name: string;
  email: string;
  company?: string;
  message?: string;
  locale?: string;
};

function isSlotBlockedLocally(date: string, time: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return true;
  if (!/^\d{2}:\d{2}$/.test(time)) return true;
  const blockedDates = parseBlockedDates(process.env.BOOKING_BLOCKED_DATES);
  if (blockedDates.includes(date)) return true;
  const busy = parseBusySlotsJson(process.env.BOOKING_BUSY_SLOTS_JSON);
  const taken = busy[date] ?? [];
  return taken.includes(time);
}

async function postResendEmail(
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[book-meeting] Resend error", res.status, errText);
    if (res.status === 403 && /domain is not verified/i.test(errText)) {
      console.error(
        "[book-meeting] Add and verify your sending domain at https://resend.com/domains, or set RESEND_FROM_EMAIL to an address on a verified domain (e.g. onboarding@resend.dev only for tests).",
      );
    }
    return false;
  }
  return true;
}

async function sendBookingEmail(opts: {
  to: string[];
  from: string;
  subject: string;
  text: string;
  html?: string;
  icsBody: string;
  apiKey: string;
}): Promise<boolean> {
  const payload: Record<string, unknown> = {
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename: "meeting.ics",
        content: Buffer.from(opts.icsBody, "utf8").toString("base64"),
      },
    ],
  };
  if (opts.html) payload.html = opts.html;
  return postResendEmail(opts.apiKey, payload);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, {
      status: 400,
    });
  }

  const { date, time, name, email } = body;
  if (!date || !time || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, {
      status: 400,
    });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!emailOk) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, {
      status: 400,
    });
  }

  if (isSlotBlockedLocally(date, time)) {
    return NextResponse.json(
      { ok: false, error: "slot_unavailable" },
      { status: 409 },
    );
  }

  if (!TIME_SLOTS.includes(time)) {
    return NextResponse.json({ ok: false, error: "invalid_slot" }, {
      status: 400,
    });
  }

  const liveAvail = await computeNativeAvailability({
    fromYmd: date,
    toYmd: date,
    debug: false,
  });
  const allowedStarts = liveAvail.availableSlotsByDate[date] ?? [];
  if (!allowedStarts.includes(time)) {
    return NextResponse.json(
      { ok: false, error: "slot_unavailable" },
      { status: 409 },
    );
  }

  const tz = getBookingTimezone();
  const organizerEmail = process.env.BOOKING_ORGANIZER_EMAIL?.trim();
  const uidHost = rewriteLegacyMentemaestraHost(
    process.env.BOOKING_ICS_UID_HOST?.trim() ||
      `bookings.${MENTEMAESTRA_STUDIO_HOSTNAME}`,
  );

  const sql = getDb();

  if (!hasDatabase() || !sql) {
    return NextResponse.json(
      { ok: false, error: "database_not_configured" },
      { status: 503 },
    );
  }
  if (!organizerEmail) {
    return NextResponse.json(
      { ok: false, error: "organizer_not_configured" },
      { status: 503 },
    );
  }

  const persistedIcsUid = `${randomUUID()}@${uidHost}`;
  const insert = await createBooking(sql, {
    booked_on: date,
    start_hm: time,
    duration_minutes: 45,
    guest_name: name.trim(),
    guest_email: email.trim(),
    company: body.company?.trim() || null,
    message: body.message?.trim() || null,
    ics_uid: persistedIcsUid,
  });

  if (!insert.ok) {
    return NextResponse.json(
      { ok: false, error: "slot_unavailable" },
      { status: 409 },
    );
  }
  const bookingPersisted = true;
  const bookingId = String(insert.id);

  let googleCalendarUrl: string;
  try {
    googleCalendarUrl = buildGoogleCalendarTemplateUrl({
      title: `Exploratory — ${name.trim()}`,
      details: [
        `Invitado: ${name.trim()} (${email.trim()})`,
        body.company?.trim() ? `Empresa: ${body.company.trim()}` : "",
        body.message?.trim() ? `Notas: ${body.message.trim()}` : "",
        "",
        `Reserva vía ${MENTEMAESTRA_STUDIO_HOSTNAME}`,
      ]
        .filter(Boolean)
        .join("\n"),
      dateYmd: date,
      timeHm: time,
      durationMinutes: 45,
      timezone: tz,
    });
  } catch (e) {
    console.error("[book-meeting] Google Calendar URL failed", e);
    return NextResponse.json({ ok: false, error: "invalid_slot" }, {
      status: 400,
    });
  }

  let icsBody: string;
  try {
    const summary = `Exploratory — ${name.trim()}`;
    const descParts = [
      `Guest: ${name.trim()} <${email.trim()}>`,
      body.company?.trim() ? `Company: ${body.company.trim()}` : "",
      body.message?.trim() ? `Notes: ${body.message.trim()}` : "",
      "",
      `Booked via ${MENTEMAESTRA_STUDIO_HOSTNAME} — add to your calendar from this invite.`,
    ].filter(Boolean);
    icsBody = buildExploratoryIcs({
      uid: persistedIcsUid,
      date,
      time,
      timezone: tz,
      summary,
      description: descParts.join("\\n"),
      organizerEmail,
      attendeeName: name.trim(),
      attendeeEmail: email.trim(),
      calendarMethod: "REQUEST",
    });
  } catch (e) {
    console.error("[book-meeting] ICS build failed", e);
    return NextResponse.json(
      { ok: false, error: "ics_build_failed" },
      { status: 500 },
    );
  }

  const push = await pushIcloudCalendarEvent({
    icsBody,
    filenameBase: icsBody.match(/UID:([^\r\n]+)/)?.[1] ?? randomUUID(),
  });
  if (!push.ok) {
    console.warn("[book-meeting] iCloud CalDAV push:", push.error);
  }

  console.info("[book-meeting]", {
    date,
    time,
    name: name.trim(),
    email: email.trim(),
    company: body.company?.trim(),
    locale: body.locale,
    bookingPersisted,
  });

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const siteUrl = getPublicSiteUrl();
  const social = getSocialUrlsForEmail();

  const expUnix =
    Math.floor(Date.now() / 1000) + icsDownloadExpirySeconds();
  const icsDownloadUrl =
    canSignIcsDownloadLinks() && bookingId
      ? `${siteUrl}/api/booking-ics?id=${encodeURIComponent(bookingId)}&e=${expUnix}&sig=${signIcsDownloadToken(bookingId, expUnix)}`
      : null;

  const dateTimeLine = formatBookingSlotSpanish(date, time, tz);
  const guestEmailVars = buildGuestMeetingConfirmationVars({
    guestName: name.trim(),
    dateTimeLine,
    googleCalendarUrl,
    icsDownloadUrl,
    siteUrl,
    socialInstagram: social.instagram,
    socialBehance: social.behance,
    socialLinkedin: social.linkedin,
    socialWeb: social.web,
  });
  const organizerEmailVars = buildOrganizerMeetingConfirmationVars({
    guestName: name.trim(),
    guestEmail: email.trim(),
    company: body.company?.trim() || null,
    message: body.message?.trim() || null,
    dateTimeLine,
    googleCalendarUrl,
    icsDownloadUrl,
    siteUrl,
    socialInstagram: social.instagram,
    socialBehance: social.behance,
    socialLinkedin: social.linkedin,
    socialWeb: social.web,
  });

  let guestHtml: string | undefined;
  let organizerHtml: string | undefined;
  try {
    guestHtml = renderMeetingConfirmationEmailEs(guestEmailVars);
  } catch (e) {
    console.error("[book-meeting] Guest HTML email render failed", e);
  }
  try {
    organizerHtml = renderMeetingConfirmationEmailEs(organizerEmailVars);
  } catch (e) {
    console.error("[book-meeting] Organizer HTML email render failed", e);
  }

  let emailSent = false;
  let guestEmailSent = false;
  if (resendKey && resendFrom) {
    const meetingTemplateId =
      process.env.RESEND_MEETING_CONFIRMATION_TEMPLATE_ID?.trim() ||
      process.env.RESEND_GUEST_MEETING_TEMPLATE_ID?.trim();

    const orgText = [
      "Nueva reunión exploratoria",
      dateTimeLine,
      `${name.trim()} <${email.trim()}>`,
      body.company?.trim() ? `Empresa: ${body.company.trim()}` : "",
      body.message?.trim() ? `Notas: ${body.message.trim()}` : "",
      "",
      "Invitación .ics adjunta.",
    ]
      .filter(Boolean)
      .join("\n");

    const guestText = [
      "Tu reunión está confirmada.",
      dateTimeLine,
      "",
      "Google Calendar:",
      googleCalendarUrl,
      icsDownloadUrl ? `\nDescarga .ics:\n${icsDownloadUrl}` : "",
      "",
      "También adjuntamos meeting.ics.",
    ]
      .filter(Boolean)
      .join("\n");

    const icsAttachment = {
      filename: "meeting.ics",
      content: Buffer.from(icsBody, "utf8").toString("base64"),
    };

    if (meetingTemplateId) {
      emailSent = await postResendEmail(resendKey, {
        from: resendFrom,
        to: [organizerEmail],
        subject: `Nueva reserva · ${name.trim()} · ${date} ${time}`,
        template: {
          id: meetingTemplateId,
          variables: buildResendMeetingConfirmationVariables(organizerEmailVars),
        },
        attachments: [icsAttachment],
      });
      guestEmailSent = await postResendEmail(resendKey, {
        from: resendFrom,
        to: [email.trim()],
        subject: `Reunión confirmada · ${date} ${time}`,
        template: {
          id: meetingTemplateId,
          variables: buildResendMeetingConfirmationVariables(guestEmailVars),
        },
        attachments: [icsAttachment],
      });
    } else {
      emailSent = await sendBookingEmail({
        apiKey: resendKey,
        from: resendFrom,
        to: [organizerEmail],
        subject: `Nueva reserva · ${name.trim()} · ${date} ${time}`,
        text: orgText,
        html: organizerHtml,
        icsBody,
      });
      guestEmailSent = await sendBookingEmail({
        apiKey: resendKey,
        from: resendFrom,
        to: [email.trim()],
        subject: `Reunión confirmada · ${date} ${time}`,
        text: guestText,
        html: guestHtml,
        icsBody,
      });
    }
  }

  const icsBase64 = Buffer.from(icsBody, "utf8").toString("base64");

  return NextResponse.json({
    ok: true,
    icsBase64,
    googleCalendarUrl,
    emailSent,
    guestEmailSent,
    bookingPersisted,
    hasIcs: true,
  });
}
