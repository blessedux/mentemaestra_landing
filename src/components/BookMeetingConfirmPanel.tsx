"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

function parseLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900/50 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export type BookMeetingConfirmPanelProps = {
  dateStr: string;
  timeStr: string;
  onDismiss: () => void;
  /** Success CTA; defaults to `onDismiss` */
  onBackHome?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  /** e.g. `mb-8` on full /book page */
  backRowClassName?: string;
  className?: string;
};

export default function BookMeetingConfirmPanel({
  dateStr,
  timeStr,
  onDismiss,
  onBackHome,
  onLoadingChange,
  backRowClassName,
  className,
}: BookMeetingConfirmPanelProps) {
  const { locale, t } = useLocale();
  const c = t.book.confirm;

  const parsed = useMemo(() => parseLocalDate(dateStr), [dateStr]);
  const slotOk = Boolean(parsed && timeStr);

  const formattedSlot =
    parsed &&
    `${parsed.toLocaleString(locale === "es" ? "es" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })} · ${timeStr}`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [icsBase64, setIcsBase64] = useState<string | null>(null);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string | null>(
    null,
  );
  const [outcome, setOutcome] = useState<{
    emailSent: boolean;
    guestEmailSent: boolean;
    bookingPersisted: boolean;
    hasIcs: boolean;
  } | null>(null);

  const setLoadingTracked = useCallback(
    (v: boolean) => {
      setLoading(v);
      onLoadingChange?.(v);
    },
    [onLoadingChange],
  );

  const downloadIcsFile = useCallback((base64: string) => {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exploratory-meeting.ics";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const submit = useCallback(async () => {
    if (!slotOk || !parsed) return;
    setLoadingTracked(true);
    setError(null);
    try {
      const res = await fetch("/api/book-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          time: timeStr,
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          message: message.trim(),
          locale,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        icsBase64?: string;
        googleCalendarUrl?: string;
        emailSent?: boolean;
        guestEmailSent?: boolean;
        bookingPersisted?: boolean;
        hasIcs?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        if (data.error === "slot_unavailable") {
          setError(c.slotUnavailable);
        } else if (data.error === "database_not_configured") {
          setError(c.databaseNotConfigured);
        } else if (data.error === "organizer_not_configured") {
          setError(c.organizerNotConfigured);
        } else if (data.error === "ics_build_failed") {
          setError(c.icsBuildFailed);
        } else {
          setError(c.error);
        }
        return;
      }
      setIcsBase64(data.icsBase64 ?? null);
      setGoogleCalendarUrl(
        typeof data.googleCalendarUrl === "string" &&
          data.googleCalendarUrl.startsWith("https://")
          ? data.googleCalendarUrl
          : null,
      );
      setOutcome({
        emailSent: Boolean(data.emailSent),
        guestEmailSent: Boolean(data.guestEmailSent),
        bookingPersisted: Boolean(data.bookingPersisted),
        hasIcs: Boolean(data.hasIcs ?? data.icsBase64),
      });
      setDone(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mm-bookings-changed"));
      }
    } catch {
      setError(c.error);
    } finally {
      setLoadingTracked(false);
    }
  }, [
    slotOk,
    parsed,
    dateStr,
    timeStr,
    name,
    email,
    company,
    message,
    locale,
    c.error,
    c.slotUnavailable,
    c.databaseNotConfigured,
    c.organizerNotConfigured,
    c.icsBuildFailed,
    setLoadingTracked,
  ]);

  const handleBackHome = onBackHome ?? onDismiss;

  const inner = !slotOk ? (
    <p className="text-zinc-400">{c.missingSlot}</p>
  ) : done ? (
    <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-none">
      <CardHeader className="space-y-1 p-4 pb-2">
        <CardTitle className="text-lg text-white">{c.successTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 text-sm text-zinc-400">
        <p className="text-zinc-200">{c.successBody}</p>
        <p className="text-xs text-zinc-500">{formattedSlot}</p>
        {outcome?.bookingPersisted &&
        !outcome.emailSent &&
        !outcome.guestEmailSent ? (
          <p className="text-amber-200/90">{c.successEmailNotSentHint}</p>
        ) : null}
        {outcome?.emailSent || outcome?.guestEmailSent ? (
          <p className="text-sm text-zinc-500">{c.successEmailLine}</p>
        ) : null}
        {outcome &&
        !outcome.bookingPersisted &&
        !outcome.emailSent &&
        !outcome.hasIcs ? (
          <p>{c.successNothingConfigured}</p>
        ) : null}
        {googleCalendarUrl && icsBase64 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              asChild
              variant="default"
              className="h-9 w-full bg-primary text-sm text-primary-foreground hover:bg-primary/90"
            >
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.addToGoogleCalendar}
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full border-zinc-600 text-sm text-white hover:bg-zinc-800"
              onClick={() => downloadIcsFile(icsBase64)}
            >
              {c.downloadIcs}
            </Button>
          </div>
        ) : icsBase64 ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full border-zinc-600 text-sm text-white hover:bg-zinc-800"
            onClick={() => downloadIcsFile(icsBase64)}
          >
            {c.downloadIcs}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-9 border-zinc-600 text-sm text-white hover:bg-zinc-800"
          onClick={handleBackHome}
        >
          {c.backHome}
        </Button>
      </CardContent>
    </Card>
  ) : (
    <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-none">
      <CardHeader className="space-y-1 p-4 pb-2">
        <CardTitle className="text-lg text-white">{c.title}</CardTitle>
        <p className="text-xs leading-snug text-zinc-400">{c.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {c.slotLabel}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-100">
            {formattedSlot}
          </p>
        </div>

        <Separator className="bg-zinc-800" />

        <div>
          <label htmlFor="book-name" className="text-xs text-zinc-300">
            {c.name}
          </label>
          <input
            id="book-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="book-email" className="text-xs text-zinc-300">
            {c.email}
          </label>
          <input
            id="book-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="book-company" className="text-xs text-zinc-300">
            {c.company}
          </label>
          <input
            id="book-company"
            name="company"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="book-message" className="text-xs text-zinc-300">
            {c.message}
          </label>
          <textarea
            id="book-message"
            name="message"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          className="h-9 w-full bg-primary text-sm text-primary-foreground hover:bg-primary/90"
          disabled={loading || !name.trim() || !email.trim()}
          onClick={() => void submit()}
        >
          {loading ? c.submitting : c.submit}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white",
          backRowClassName,
        )}
        onClick={onDismiss}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {c.back}
      </button>
      {inner}
    </div>
  );
}
