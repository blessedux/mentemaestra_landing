"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { BOOKING_REOPEN_STORAGE_KEY } from "@/lib/booking-flow";

export default function BookLegacyRedirect() {
  const sp = useSearchParams();
  const date = sp.get("date");
  const time = sp.get("time");

  useEffect(() => {
    if (date && time) {
      try {
        sessionStorage.setItem(
          BOOKING_REOPEN_STORAGE_KEY,
          JSON.stringify({ date, time }),
        );
      } catch {
        /* quota / private mode */
      }
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    window.location.replace(`${origin}/#book-meeting`);
  }, [date, time]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
      Redirecting…
    </div>
  );
}
