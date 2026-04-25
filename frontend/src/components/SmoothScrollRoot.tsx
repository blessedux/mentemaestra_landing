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

    /** Lenis drives scroll; native `documentElement.scrollTop` stays ~0, so ScrollTrigger must read Lenis. */
    const scroller = document.documentElement;
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

    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);
    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", onLenisScroll);
      gsap.ticker.remove(tickerCb);
      gsap.ticker.lagSmoothing(500, 33);
      ScrollTrigger.defaults({ scroller: window });
      ScrollTrigger.scrollerProxy(scroller);
      ScrollTrigger.refresh();
    };
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
