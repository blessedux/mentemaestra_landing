"use client";

import { useEffect, useRef, useState } from "react";

import { sanitizeRevisedActionTitle } from "@/lib/revised-action-sanitize";

// ---------------------------------------------------------------------------
// TypewriterUpdate — morphs text via shared-prefix (smooth title updates)
// ---------------------------------------------------------------------------

type UpdateProps = {
  /** Current (original) text displayed. */
  text: string;
  /** When provided and different from text, triggers transition to new title. */
  nextText?: string;
  speedDeleteMs?: number;
  speedTypeMs?: number;
};

function commonPrefixLength(a: string, b: string): number {
  const lim = Math.min(a.length, b.length);
  let i = 0;
  while (i < lim && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  return i;
}

export function TypewriterUpdate({
  text,
  nextText,
  speedDeleteMs = 32,
  speedTypeMs = 14,
}: UpdateProps) {
  const safeNext = sanitizeRevisedActionTitle(nextText);
  const to = safeNext ?? text;
  const [displayed, setDisplayed] = useState(text);
  const [phase, setPhase] = useState<"idle" | "deleting" | "typing">("idle");
  const [deleteStopAt, setDeleteStopAt] = useState(0);
  /** Tracks last animated target so we only run transitions when `to` actually changes. */
  const prevTo = useRef(text);
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  // Keep on-screen text aligned when target equals base (e.g. revision cleared)
  useEffect(() => {
    if (phase !== "idle") return;
    if (to !== text) return;
    if (displayed !== text) setDisplayed(text);
  }, [text, to, phase, displayed]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (to === prevTo.current) return;

    if (prefersReduced) {
      setDisplayed(to);
      prevTo.current = to;
      setPhase("idle");
      return;
    }

    const fromSnapshot = displayedRef.current;
    const prefix = commonPrefixLength(fromSnapshot, to);
    setDeleteStopAt(prefix);
    prevTo.current = to;
    setPhase("deleting");
  }, [to]);

  useEffect(() => {
    if (phase === "idle") return;

    if (phase === "deleting") {
      if (displayed.length <= deleteStopAt) {
        setPhase("typing");
        return;
      }
      const t = setTimeout(
        () => setDisplayed((d) => d.slice(0, -1)),
        speedDeleteMs,
      );
      return () => clearTimeout(t);
    }

    if (phase === "typing") {
      if (displayed.length >= to.length) {
        setPhase("idle");
        return;
      }
      const t = setTimeout(() => {
        setDisplayed(to.slice(0, displayed.length + 1));
      }, speedTypeMs);
      return () => clearTimeout(t);
    }
  }, [phase, displayed, to, deleteStopAt, speedDeleteMs, speedTypeMs]);

  return (
    <span>
      {displayed}
      {phase !== "idle" && (
        <span
          aria-hidden="true"
          className="ml-px inline-block h-[1em] w-[2px] translate-y-[1px] animate-pulse bg-current opacity-70"
        />
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------

type Props = {
  text: string;
  speedMs?: number;
};

/**
 * Animates text character-by-character.
 * Respects prefers-reduced-motion: renders full text instantly.
 */
export default function TypewriterText({ text, speedMs = 18 }: Props) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplayed(text);
      return;
    }

    indexRef.current = 0;
    setDisplayed("");

    function tick() {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
        timerRef.current = setTimeout(tick, speedMs);
      }
    }

    timerRef.current = setTimeout(tick, speedMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speedMs]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span
          aria-hidden="true"
          className="ml-px inline-block h-[1em] w-[2px] translate-y-[1px] animate-pulse bg-current opacity-70"
        />
      )}
    </span>
  );
}
