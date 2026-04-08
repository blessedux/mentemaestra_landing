"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import BrainThoughtsCycle from "@/components/BrainThoughtsCycle";

function scrollDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage?.getItem("mm-debug-scroll") === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    return new URLSearchParams(window.location.search).get("debugScroll") === "1";
  } catch {
    return false;
  }
}

function logScrollEnvironment(label: string) {
  if (typeof document === "undefined") return;
  const b = document.body;
  const h = document.documentElement;
  const main = document.querySelector("main");
  console.info(`[mm:Brain3d] ${label}`, {
    body: { overflow: getComputedStyle(b).overflow, overflowY: getComputedStyle(b).overflowY },
    html: { overflow: getComputedStyle(h).overflow, overflowY: getComputedStyle(h).overflowY },
    main: main
      ? {
          overflow: getComputedStyle(main).overflow,
          overflowY: getComputedStyle(main).overflowY,
        }
      : null,
  });
}

export type Brain3dExperienceProps = {
  className?: string;
  /** Enables stats panel + dat.gui (original demo controls). */
  debug?: boolean;
  /** Use every Nth vertex from the brain mesh (larger = fewer particles). Default 3. */
  particleStride?: number;
  /** Short lines shown above the brain; cycles automatically. */
  thoughts?: ReadonlyArray<string>;
  /** Extra classes on the thoughts strip (e.g. clear a top-left label). */
  thoughtsOverlayClassName?: string;
  /** No scene lights, fog, x-ray, bloom, or “thinking” sparks — particle points only. */
  particlesOnly?: boolean;
  /**
   * When true, enables wheel zoom + right/middle pan. When false (landing), wheel still scrolls
   * the page; you can drag to rotate on mouse; touch uses auto-rotate so vertical scroll works.
   */
  enableOrbitZoom?: boolean;
};

/**
 * Embeds the [victors1681/3dbrain](https://github.com/victors1681/3dbrain) particle brain (Three.js r91 + three-bas).
 * Loads only on the client; disposes WebGL + tweens on unmount.
 */
export default function Brain3dExperience({
  className,
  debug = false,
  particleStride = 3,
  thoughts,
  thoughtsOverlayClassName,
  particlesOnly = true,
  enableOrbitZoom = false,
}: Brain3dExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !scrollDebugEnabled()) return;
    logScrollEnvironment("mount (before MainBrain)");
    return () => logScrollEnvironment("unmount");
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let instance: { destroy: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      const { default: MainBrain } = await import("@/3dbrain/legacy/js/MainBrain");
      if (cancelled || !containerRef.current) return;
      instance = new MainBrain(containerRef.current, {
        debug,
        particleStride,
        particlesOnly,
        enableOrbitZoom,
      });
      if (process.env.NODE_ENV === "development" && scrollDebugEnabled()) {
        logScrollEnvironment("MainBrain constructed");
      }
    })();

    return () => {
      cancelled = true;
      instance?.destroy();
      instance = null;
    };
  }, [debug, particleStride, particlesOnly, enableOrbitZoom]);

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      {thoughts && thoughts.length > 0 ? (
        <BrainThoughtsCycle
          thoughts={thoughts}
          className={thoughtsOverlayClassName}
        />
      ) : null}
      <div
        ref={containerRef}
        className="h-full w-full min-h-[200px] overflow-hidden"
      />
    </div>
  );
}
