"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SLOT_COUNT, TIME_SLOTS } from "@/lib/booking-slots";
import { useLocale } from "@/i18n/LocaleProvider";

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthRangeYmd(monthAnchor: Date): { from: string; to: string } {
  const y = monthAnchor.getFullYear();
  const m0 = monthAnchor.getMonth();
  const from = `${y}-${pad2(m0 + 1)}-01`;
  const lastDay = new Date(y, m0 + 1, 0).getDate();
  const to = `${y}-${pad2(m0 + 1)}-${pad2(lastDay)}`;
  return { from, to };
}

function dayFullyBookedStatic(
  ymd: string,
  busyByDate: Record<string, string[]>,
): boolean {
  const busy = busyByDate[ymd] ?? [];
  return busy.length >= SLOT_COUNT;
}

type AvailabilityResponse = {
  source: "native";
  timezone: string;
  availableSlotsByDate: Record<string, string[]>;
  blockedDates: string[];
  /** True when DATABASE_URL is set (server has config). */
  databaseConfigured?: boolean;
  /** True when we successfully merged busy slots from Postgres. */
  databaseConnected?: boolean;
  caldavOk?: boolean;
  caldavError?: string;
  caldavConfigured?: boolean;
};

type BookMeetingCardProps = {
  /** When set, Continue stays on the landing page (inline confirm overlay). */
  onRequestConfirm?: (dateYmd: string, timeHm: string) => void;
};

export default function BookMeetingCard({
  onRequestConfirm,
}: BookMeetingCardProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const copy = t.book.meeting;

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );

  const [date, setDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const [month, setMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    const { from, to } = monthRangeYmd(month);
    try {
      const res = await fetch(
        `/api/booking-availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as AvailabilityResponse;
      setAvailability(data);
    } catch {
      /* network / parse */
    }
  }, [month]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    const onBookingsChanged = () => {
      void loadAvailability();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadAvailability();
    };
    const onFocus = () => {
      void loadAvailability();
    };
    window.addEventListener("mm-bookings-changed", onBookingsChanged);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("mm-bookings-changed", onBookingsChanged);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadAvailability]);

  /** Reconcile picker with live CalDAV/DB without waiting for tab switch (long sessions). */
  useEffect(() => {
    const t = window.setInterval(() => {
      void loadAvailability();
    }, 60_000);
    return () => window.clearInterval(t);
  }, [loadAvailability]);

  const blockedDateKeys = useMemo(
    () => availability?.blockedDates ?? [],
    [availability?.blockedDates],
  );

  const busySlotsByDate = useMemo((): Record<string, string[]> => {
    if (!availability) return {};
    if (availability.source !== "native") return {};
    const busy: Record<string, string[]> = {};
    for (const ymd of Object.keys(availability.availableSlotsByDate)) {
      const allowed = new Set(availability.availableSlotsByDate[ymd] ?? []);
      const taken = TIME_SLOTS.filter((s) => !allowed.has(s));
      if (taken.length > 0) busy[ymd] = taken;
    }
    return busy;
  }, [availability]);

  const bookedDates = useMemo(() => {
    return blockedDateKeys.map((ymd) => {
      const [y, m, d] = ymd.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setHours(12, 0, 0, 0);
      return dt;
    });
  }, [blockedDateKeys]);

  /** Slots the API marks as bookable for the selected day. Empty while loading (avoid flash of false “open” slots). */
  const allowedSlotSet = useMemo(() => {
    if (!date) return null;
    const key = toLocalDateKey(date);
    if (!availability) return new Set<string>();
    if (availability.source !== "native") {
      const busy = busySlotsByDate[key] ?? [];
      return new Set(TIME_SLOTS.filter((s) => !busy.includes(s)));
    }
    return new Set(availability.availableSlotsByDate[key] ?? []);
  }, [date, availability, busySlotsByDate]);

  useEffect(() => {
    if (!selectedTime || !date) return;
    const key = toLocalDateKey(date);
    if (!availability || availability.source !== "native") {
      if (!availability) return;
      const busy = busySlotsByDate[key] ?? [];
      if (busy.includes(selectedTime)) setSelectedTime(null);
      return;
    }
    const allowed = availability.availableSlotsByDate[key] ?? [];
    if (!allowed.includes(selectedTime)) setSelectedTime(null);
  }, [selectedTime, date, availability, busySlotsByDate]);

  const calendarDayUnavailable = useCallback(
    (d: Date) => {
      if (!availability || availability.source !== "native") return false;
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (x < today) return false;
      if (x.getDay() === 0 || x.getDay() === 6) return false;
      const key = toLocalDateKey(x);
      if (blockedDateKeys.includes(key)) return false;
      const slots = availability.availableSlotsByDate[key];
      return !slots || slots.length === 0;
    },
    [availability, blockedDateKeys],
  );

  const weekdayFormatter = useMemo(
    () => ({
      formatWeekdayName: (d: Date) =>
        d.toLocaleString(locale === "es" ? "es" : "en-US", {
          weekday: "short",
        }),
    }),
    [locale],
  );

  const dateDisabled = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (x < today) return true;

    const key = toLocalDateKey(x);
    const weekend = x.getDay() === 0 || x.getDay() === 6;

    if (availability?.source === "native") {
      if (blockedDateKeys.includes(key)) return true;
      if (weekend) return true;
      const slots = availability.availableSlotsByDate[key];
      if (!slots || slots.length === 0) return true;
      return false;
    }

    if (weekend) return true;
    if (dayFullyBookedStatic(key, busySlotsByDate)) return true;
    return bookedDates.some(
      (b) =>
        b.getFullYear() === x.getFullYear() &&
        b.getMonth() === x.getMonth() &&
        b.getDate() === x.getDate(),
    );
  };

  const onSelectDate = (d: Date | undefined) => {
    setDate(d);
    setSelectedTime(null);
    if (d) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const goConfirm = () => {
    if (!date || !selectedTime) return;
    const dateYmd = toLocalDateKey(date);
    const timeHm = selectedTime;
    if (onRequestConfirm) {
      onRequestConfirm(dateYmd, timeHm);
      return;
    }
    const q = new URLSearchParams({ date: dateYmd, time: timeHm });
    router.push(`/book?${q.toString()}`);
  };

  const formattedDate =
    date &&
    date.toLocaleString(locale === "es" ? "es" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const dbWarn =
    availability?.source === "native" &&
    availability.databaseConnected === false;
  const configured = availability?.databaseConfigured !== false;
  const nativeWarn =
    availability?.source === "native" &&
    (dbWarn || Boolean(availability.caldavError));

  const timeColumnDisabled = Boolean(
    !date || (date ? dateDisabled(date) : false),
  );

  return (
    <Card className="gap-0 overflow-hidden border-zinc-800 bg-zinc-950/60 p-0 text-zinc-100 shadow-none">
        <CardHeader className="flex h-max justify-center border-b border-zinc-800 bg-zinc-950/80 p-4">
          <CardTitle className="font-[family-name:var(--font-geist-sans)] text-lg text-white md:text-xl">
            {copy.cardTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-0 md:pr-48">
          {nativeWarn ? (
            <p className="border-b border-amber-900/40 bg-amber-950/30 px-6 py-3 text-xs text-amber-100/85">
              {dbWarn
                ? configured
                  ? copy.availabilityDbQueryFailed
                  : copy.availabilityDbWarning
                : copy.availabilityCaldavWarning}
            </p>
          ) : null}
          <div className="p-6">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={date}
              onSelect={onSelectDate}
              disabled={dateDisabled}
              showOutsideDays={false}
              modifiers={{
                booked: bookedDates,
                dayUnavailable: calendarDayUnavailable,
              }}
              modifiersClassNames={{
                booked: "[&>button]:line-through opacity-100",
                dayUnavailable: "[&>button]:line-through opacity-100",
              }}
              className="bg-transparent p-0 text-foreground [--cell-size:2.5rem]"
              formatters={weekdayFormatter}
            />
          </div>
          <div
            className="relative z-20 inset-y-0 right-0 flex max-h-[min(360px,50vh)] w-full flex-col gap-4 border-t border-zinc-800 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l md:border-zinc-800"
            data-lenis-prevent
          >
            <ScrollArea
              className="h-60 md:h-full md:min-h-[280px]"
              data-lenis-prevent
            >
              <div className="flex flex-col gap-2 p-6">
                {date && timeColumnDisabled ? (
                  <p className="text-center text-xs text-zinc-500">
                    {copy.noSlotsForDay}
                  </p>
                ) : null}
                {TIME_SLOTS.map((time) => {
                  const allowed = allowedSlotSet?.has(time) ?? true;
                  const inactive = timeColumnDisabled || !allowed;
                  return (
                    <Button
                      key={time}
                      type="button"
                      disabled={inactive}
                      variant={
                        selectedTime === time && !inactive ? "default" : "outline"
                      }
                      onClick={() => {
                        if (inactive) return;
                        setSelectedTime(time);
                      }}
                      className={
                        inactive
                          ? "w-full cursor-not-allowed border-zinc-800 bg-zinc-950/40 text-zinc-600 opacity-50 shadow-none hover:bg-zinc-950/40"
                          : "w-full border-zinc-700 bg-zinc-900/40 text-zinc-200 shadow-none hover:bg-zinc-800"
                      }
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-zinc-800 bg-zinc-950/80 px-6 !py-5 md:flex-row md:items-center">
          <div className="flex items-start gap-2 text-sm text-zinc-400">
            {date && selectedTime ? (
              <>
                <CircleCheckIcon className="mt-0.5 size-5 shrink-0 stroke-emerald-500" />
                <span>
                  {copy.summaryLead}{" "}
                  <span className="font-medium text-zinc-100">
                    {formattedDate}
                  </span>{" "}
                  {copy.summaryAt}{" "}
                  <span className="font-medium text-zinc-100">
                    {selectedTime}
                  </span>
                  .
                </span>
              </>
            ) : (
              <span>{copy.selectPrompt}</span>
            )}
          </div>
          <Button
            type="button"
            disabled={!date || !selectedTime}
            onClick={goConfirm}
            className="w-full border border-zinc-600 bg-transparent text-white hover:bg-zinc-800 md:ml-auto md:w-auto"
            variant="outline"
          >
            {copy.continue}
          </Button>
        </CardFooter>
    </Card>
  );
}
