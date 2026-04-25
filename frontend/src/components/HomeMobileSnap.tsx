"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { hashScrollOptions } from "@/components/SmoothScrollRoot";

/**
 * Enables mobile scroll snapping for Home by toggling a dataset flag on `<html>`.
 * This avoids relying on `:has(...)` selector support across browsers.
 */
export default function HomeMobileSnap() {
  const lenis = useLenis();

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.dataset.homeSnap;
    root.dataset.homeSnap = "true";

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isCoarsePointer || reducedMotion || !lenis) {
      return () => {
        if (prev === undefined) delete root.dataset.homeSnap;
        else root.dataset.homeSnap = prev;
      };
    }

    const HEADER_OFFSET_PX = 80;
    let snapping = false;
    let rafId: number | null = null;
    let touchStartY: number | null = null;

    const getTop = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const y = window.scrollY + el.getBoundingClientRect().top;
      return y;
    };

    const snapTo = (targetY: number) => {
      snapping = true;
      const top = Math.max(0, targetY - HEADER_OFFSET_PX);
      lenis.scrollTo(top, {
        ...hashScrollOptions(false),
        // Slightly shorter than hash nav so it feels “snappy” but still smooth.
        duration: 0.85,
      });
      window.setTimeout(() => (snapping = false), 900);
    };

    const decideAndSnap = (directionDown: boolean) => {
      if (snapping) return;

      const heroTop = getTop("hero");
      const aboutTop = getTop("about");
      if (heroTop == null || aboutTop == null) return;

      const y = window.scrollY;

      // If the user is between sections, resolve to the next/previous section based on direction.
      // This makes a single swipe from the hero reliably land on About.
      const midway = heroTop + (aboutTop - heroTop) * 0.45;
      if (directionDown) {
        if (y < aboutTop - HEADER_OFFSET_PX && y >= heroTop - 2) {
          snapTo(y >= midway ? aboutTop : heroTop);
        }
      } else {
        if (y <= aboutTop - HEADER_OFFSET_PX && y > heroTop - 2) {
          snapTo(y <= midway ? heroTop : aboutTop);
        }
      }
    };

    const startSettleMonitor = (directionDown: boolean) => {
      if (rafId != null) cancelAnimationFrame(rafId);
      let stableFrames = 0;
      let prevY = window.scrollY;
      const startedAt = performance.now();
      const MAX_WAIT_MS = 650;

      const tick = () => {
        // If another gesture starts, don't fight it.
        if (snapping) {
          rafId = requestAnimationFrame(tick);
          return;
        }

        const y = window.scrollY;
        const dy = Math.abs(y - prevY);
        prevY = y;

        // Consider “settled” when position barely changes for a few frames.
        if (dy < 0.5) stableFrames += 1;
        else stableFrames = 0;

        // If momentum never fully settles (quick flick), still resolve after a cap.
        const elapsed = performance.now() - startedAt;
        if ((stableFrames >= 6 && elapsed > 80) || elapsed > MAX_WAIT_MS) {
          decideAndSnap(directionDown);
          rafId = null;
          return;
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    };

    let lastScrollY = window.scrollY;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      // Prefer actual finger swipe direction (reliable even on fast flicks).
      const endY = e.changedTouches?.[0]?.clientY;
      if (typeof endY === "number" && typeof touchStartY === "number") {
        const deltaY = endY - touchStartY;
        const SWIPE_THRESHOLD_PX = 22;
        if (Math.abs(deltaY) >= SWIPE_THRESHOLD_PX) {
          const directionDown = deltaY < 0;
          startSettleMonitor(directionDown);
          touchStartY = null;
          return;
        }
      }

      // Fallback: determine direction from last observed scroll delta.
      const y = window.scrollY;
      const directionDown = y > lastScrollY;
      lastScrollY = y;
      startSettleMonitor(directionDown);
      touchStartY = null;
    };

    const onScroll = () => {
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      if (rafId != null) cancelAnimationFrame(rafId);
      if (prev === undefined) delete root.dataset.homeSnap;
      else root.dataset.homeSnap = prev;
    };
  }, [lenis]);

  return null;
}

