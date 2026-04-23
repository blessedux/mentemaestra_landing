"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  supportEmail: string;
};

/** Shared warning triangle icon used in the support button and onboarding. */
export function WarningIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Inline help control — sits inside the footer nav row.
 * Collapsed state: a small warning/danger icon.
 * Expanded state: a floating popover with the support email.
 */
export default function PortalSupportButton({ supportEmail }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative sm:flex sm:justify-end">
      {/* Popover — opens above the button */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-[min(90vw,18rem)] rounded-xl border border-zinc-700 bg-zinc-950/95 px-4 py-3 text-sm leading-relaxed text-zinc-300 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm"
          role="dialog"
          aria-label="Ayuda y soporte"
        >
          <p className="mb-2 text-zinc-400">
            ¿Necesitas ayuda? Escríbenos y te respondemos pronto.
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-[#c9a07a] underline underline-offset-2 transition hover:text-[#ddb896]"
          >
            {supportEmail}
          </a>
        </div>
      )}

      {/* Trigger — danger/warning icon, styled to match nav links */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-label={open ? "Cerrar ayuda" : "Ayuda — contactar soporte"}
        className="flex items-center gap-1.5 text-sm text-zinc-600 underline-offset-2 transition hover:text-amber-500 hover:underline"
      >
        <WarningIcon />
        <span>Contactar soporte</span>
      </button>
    </div>
  );
}
