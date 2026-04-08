"use client";

import { useCallback, useEffect, useState } from "react";

import BookMeetingCard from "@/components/BookMeetingCard";
import BookMeetingConfirmPanel from "@/components/BookMeetingConfirmPanel";
import { useLocale } from "@/i18n/LocaleProvider";
import { BOOKING_REOPEN_STORAGE_KEY } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";

export default function BookMeetingSection() {
  const { t } = useLocale();
  const copy = t.book.section;

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const resetToPicker = useCallback(() => {
    setOverlayOpen(false);
    setSlotDate(null);
    setSlotTime(null);
  }, []);

  const openConfirm = useCallback((dateYmd: string, timeHm: string) => {
    setSlotDate(dateYmd);
    setSlotTime(timeHm);
    setOverlayOpen(true);
  }, []);

  const handleBackdropClick = useCallback(() => {
    if (confirmLoading) return;
    resetToPicker();
  }, [confirmLoading, resetToPicker]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_REOPEN_STORAGE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(BOOKING_REOPEN_STORAGE_KEY);
      const parsed = JSON.parse(raw) as { date?: unknown; time?: unknown };
      if (
        typeof parsed.date === "string" &&
        typeof parsed.time === "string" &&
        parsed.date &&
        parsed.time
      ) {
        openConfirm(parsed.date, parsed.time);
      }
    } catch {
      /* invalid JSON */
    }
  }, [openConfirm]);

  useEffect(() => {
    if (!overlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmLoading) resetToPicker();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen, confirmLoading, resetToPicker]);

  return (
    <section
      id="book-meeting"
      className="relative scroll-mt-28 border-t border-zinc-800/90 bg-[#0a0a0a] px-6 py-24"
    >
      {overlayOpen ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[60] cursor-default bg-black/55 backdrop-blur-md"
          onClick={handleBackdropClick}
          role="presentation"
        />
      ) : null}

      {overlayOpen && slotDate && slotTime ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          onClick={(e) => {
            // Click outside the panel closes the overlay.
            if (e.target !== e.currentTarget) return;
            handleBackdropClick();
          }}
        >
          <div
            className="w-full max-w-md"
            onClick={(e) => {
              // Clicks inside the panel should not close the overlay.
              e.stopPropagation();
            }}
          >
            <div className="max-h-[min(86dvh,calc(100svh-2rem))] min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-2xl border border-zinc-800/50 bg-[#0a0a0a]/95 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:p-4">
              <BookMeetingConfirmPanel
                dateStr={slotDate}
                timeStr={slotTime}
                onDismiss={resetToPicker}
                onBackHome={resetToPicker}
                onLoadingChange={setConfirmLoading}
                backRowClassName="mb-3"
              />
              <div className="h-2" />
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "mx-auto max-w-3xl",
          overlayOpen && "pointer-events-none",
        )}
      >
        <div className="mb-10 text-center md:mb-12">
          <div className="mb-4 flex justify-center">
            <span className="text-xs uppercase tracking-[0.2em] text-accent">
              {copy.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 md:text-base">
            {copy.subtitle}
          </p>
        </div>

        <div
          className={cn(
            "relative",
            overlayOpen && "opacity-40",
          )}
        >
          <div
            className={cn(
              "min-w-0",
              overlayOpen &&
                "pointer-events-none invisible absolute inset-x-0 top-0 z-0 opacity-0",
            )}
            {...(overlayOpen ? ({ "aria-hidden": true } as const) : {})}
          >
            <BookMeetingCard onRequestConfirm={openConfirm} />
          </div>
        </div>
      </div>
    </section>
  );
}
