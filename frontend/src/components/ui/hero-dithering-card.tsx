"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale } from "@/i18n/LocaleProvider";

/** Hero copy only — card / shader background temporarily removed. */
export function HeroDitheringCard() {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const titleBlock = titleBlockRef.current;
    if (!section || !container || !titleBlock) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const travel = () => {
        const h = container.clientHeight;
        const th = titleBlock.offsetHeight;
        return Math.max(0, h - th);
      };

      gsap.set(titleBlock, { y: 0, opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom center",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // Slide continuously for the full scroll range.
      tl.to(titleBlock, { y: travel, ease: "none", duration: 1 }, 0);
      // Fade out only near the end (without affecting y).
      tl.to(titleBlock, { opacity: 0, ease: "none", duration: 0.25 }, 0.75);
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    const t1 = window.setTimeout(refresh, 100);
    const t2 = window.setTimeout(refresh, 400);

    return () => {
      window.removeEventListener("resize", refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex w-full justify-center px-4 pb-12 pt-28 md:px-6 lg:min-h-[120vh] border border-yellow-400"
    >
      <div
        ref={containerRef}
        className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-12 text-center md:py-16 border border-yellow-400"
      >
        <div
          ref={titleBlockRef}
          className="absolute left-1/2 top-0 w-full -translate-x-1/2"
        >
          <h1 className="mb-4 overflow-visible text-5xl font-normal leading-[0.525] tracking-tight text-white md:text-7xl lg:text-8xl">
            <span className="hero-title-line-1 block font-hero-bootzy">Mente</span>
            <span className="hero-title-line-2 block font-hero-new-icon-script">
              Maestra
            </span>
          </h1>

          <p className="hero-support-line-1 mx-auto max-w-2xl text-lg font-medium leading-snug tracking-tight text-white md:text-xl">
            {t.hero.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
