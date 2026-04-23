"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import BookMeetingCard from "@/components/BookMeetingCard";
import BookMeetingConfirmPanel from "@/components/BookMeetingConfirmPanel";
import { BOOKING_REOPEN_STORAGE_KEY } from "@/lib/booking-flow";
import { cn } from "@/lib/utils";

export type BookMeetingInlineProps = {
  /** `aria-label` on the confirm dialog (e.g. section title). */
  dialogAriaLabel: string;
  /** Content above the booking card (titles, qualification, etc.). */
  intro: ReactNode;
  /** Optional max width on the inner column. */
  contentClassName?: string;
  /** After closing the success state from “back home”, run after reset (e.g. `router.push('/')`). */
  onAfterBackHome?: () => void;
};

/**
 * Booking picker + confirm overlay. Shared by the landing book section and `/onboarding`.
 */
export default function BookMeetingInline({
  dialogAriaLabel,
  intro,
  contentClassName,
  onAfterBackHome,
}: BookMeetingInlineProps) {
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

  const handleBackHome = useCallback(() => {
    resetToPicker();
    onAfterBackHome?.();
  }, [onAfterBackHome, resetToPicker]);

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
    <>
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
          aria-label={dialogAriaLabel}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            handleBackdropClick();
          }}
        >
          <div
            className="w-full max-w-md"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div
              data-lenis-prevent
              className="max-h-[min(86dvh,calc(100svh-2rem))] min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-2xl border border-zinc-800/50 bg-[#0a0a0a]/95 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:p-4"
            >
              <BookMeetingConfirmPanel
                dateStr={slotDate}
                timeStr={slotTime}
                onDismiss={resetToPicker}
                onBackHome={handleBackHome}
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
          "mx-auto w-full max-w-3xl",
          overlayOpen && "pointer-events-none",
          contentClassName,
        )}
      >
        {intro}

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
    </>
  );
}
