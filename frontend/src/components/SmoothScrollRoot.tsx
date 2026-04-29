"use client";

import * as React from "react";
import { ReactLenis, useLenis } from "lenis/react";
import type { ScrollToOptions } from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "lenis/dist/lenis.css";

const DEFAULT_SCROLL_EASING = (t: number) =>
  Math.min(1, 1.001 - 2 ** (-10 * t));

/** Hash / nav scroll: slow, eased glide (Lenis programmatic scroll). */
export function hashScrollOptions(
  reducedMotion: boolean,
): Pick<ScrollToOptions, "duration" | "easing" | "immediate"> {
  if (reducedMotion) return { immediate: true };
  return {
    duration: 1.48,
    easing: DEFAULT_SCROLL_EASING,
  };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function LenisGsapAndHashBridge() {
  const lenis = useLenis();

  React.useEffect(() => {
    if (!lenis) return;
    gsap.registerPlugin(ScrollTrigger);

    /**
     * On touch/coarse-pointer devices (phones, tablets) iOS Safari throttles
     * requestAnimationFrame during scroll gestures. GSAP drives Lenis via rAF,
     * so `lenis.scroll` can be stale when ScrollTrigger reads it through the
     * proxy — ScrollTrigger sees position=0 while window.scrollY is already
     * hundreds of pixels ahead, locking scrub animations on the hero section.
     *
     * Fix: skip the proxy on touch devices so ScrollTrigger reads window.scrollY
     * directly. A passive window scroll listener keeps ScrollTrigger updated on
     * every native scroll tick instead of relying on Lenis's RAF cadence.
     */
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const scroller = document.documentElement;

    if (!isCoarsePointer) {
      // Desktop: Lenis smooths wheel scroll; proxy needed so ScrollTrigger reads
      // lenis.scroll (native documentElement.scrollTop stays ~0 while Lenis runs).
      ScrollTrigger.scrollerProxy(scroller, {
        scrollTop(value) {
          if (arguments.length) {
            lenis.scrollTo(Number(value), { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
      });
      ScrollTrigger.defaults({ scroller: scroller });
    }

    // Lenis internal scroll event → keep ScrollTrigger in sync on desktop.
    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);

    // On mobile, native scroll events fire synchronously with window.scrollY,
    // bypassing any rAF lag. This guarantees ScrollTrigger always reads the
    // current position, even when GSAP ticker is throttled by iOS.
    const onNativeScroll = isCoarsePointer
      ? () => ScrollTrigger.update()
      : null;
    if (onNativeScroll) {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
    }

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", onLenisScroll);
      if (onNativeScroll) {
        window.removeEventListener("scroll", onNativeScroll);
      }
      gsap.ticker.remove(tickerCb);
      gsap.ticker.lagSmoothing(500, 33);
      if (!isCoarsePointer) {
        ScrollTrigger.defaults({ scroller: window });
        ScrollTrigger.scrollerProxy(scroller);
      }
      ScrollTrigger.refresh();
    };
  }, [lenis]);

  React.useEffect(() => {
    if (!lenis) return;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) return;

    /**
     * Trackpad momentum can keep firing wheel events after we've already hit the
     * document edge. Lenis will happily keep accumulating a target scroll past
     * the limit, which creates a "banked" distance you must scroll back before
     * upward motion takes effect.
     *
     * Fix: when we're already at an edge and the wheel continues in the same
     * direction, immediately clamp Lenis's internal target to the true limit
     * and reset momentum so reversing direction is instant.
     */
    const onWheelCapture = (e: WheelEvent) => {
      // Respect nested scroll areas / modal scroll panes.
      const target = e.target;
      if (target instanceof Element && target.closest("[data-lenis-prevent]")) {
        return;
      }

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const y = window.scrollY;
      const atTop = y <= 0;
      const atBottom = y >= maxScroll - 1;
      const dy = e.deltaY;

      const overscrollingTop = atTop && dy < 0;
      const overscrollingBottom = atBottom && dy > 0;
      if (!overscrollingTop && !overscrollingBottom) return;

      // Clamp target + kill any carried momentum.
      const clamped = overscrollingTop ? 0 : maxScroll;
      lenis.stop();
      lenis.scrollTo(clamped, { immediate: true });
      lenis.start();

      // Prevent Lenis (and the browser) from banking more delta at the edge.
      e.preventDefault();
      e.stopPropagation();
      // Some listeners (including Lenis) are on the same target; stop them too.
      (e as unknown as { stopImmediatePropagation?: () => void })
        .stopImmediatePropagation?.();
    };

    window.addEventListener("wheel", onWheelCapture, {
      passive: false,
      capture: true,
    });
    return () =>
      window.removeEventListener("wheel", onWheelCapture, { capture: true });
  }, [lenis]);

  React.useEffect(() => {
    if (!lenis) return;
    const onClickCapture = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      const a = el.closest("a[href]");
      if (!a || !(a instanceof HTMLAnchorElement)) return;
      const hrefAttr = a.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:"))
        return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (!url.hash || url.hash === "#") return;
      if (url.origin !== window.location.origin) return;
      const targetPath = url.pathname.replace(/\/$/, "") || "/";
      const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
      if (targetPath !== currentPath) return;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!id) return;
      const targetEl = document.getElementById(id);
      if (!targetEl) return;
      e.preventDefault();
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      lenis.scrollTo(url.hash, hashScrollOptions(motion));
      if (window.location.hash !== url.hash) {
        window.history.pushState(null, "", `${targetPath}${url.hash}`);
      }
    };
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [lenis]);

  return null;
}

export default function SmoothScrollRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const lenisOptions = React.useMemo(
    () =>
      reducedMotion
        ? {
            lerp: 1,
            smoothWheel: false,
            smoothTouch: false,
            wheelMultiplier: 1,
            touchMultiplier: 1,
            autoRaf: false,
            anchors: false,
          }
        : {
            /** Lower = heavier, more carry / momentum */
            lerp: 0.048,
            /** Less distance per wheel notch on desktop */
            wheelMultiplier: 0.66,
            /**
             * smoothTouch: false → native touch scroll on mobile.
             * touchMultiplier only activates when smoothTouch is true,
             * so this value is a no-op — kept as documentation.
             */
            smoothTouch: false,
            touchMultiplier: 1,
            smoothWheel: true,
            autoRaf: false,
            anchors: false,
          },
    [reducedMotion],
  );

  return (
    <ReactLenis root options={lenisOptions}>
      <LenisGsapAndHashBridge />
      {children}
    </ReactLenis>
  );
}
