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
    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);
    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.off("scroll", onLenisScroll);
      gsap.ticker.remove(tickerCb);
      gsap.ticker.lagSmoothing(500, 33);
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
            wheelMultiplier: 1,
            touchMultiplier: 1,
            autoRaf: false,
            anchors: false,
          }
        : {
            /** Lower = heavier, more carry / momentum */
            lerp: 0.048,
            /** Less distance per wheel notch */
            wheelMultiplier: 0.66,
            touchMultiplier: 0.82,
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
