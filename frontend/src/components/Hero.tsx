"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { usePageTransition } from "@/components/PageTransition";

const GLSLHills = dynamic(() => import("@/components/GLSLHills"), {
  ssr: false,
  loading: () => null,
});

/**
 * Share of *remaining* hero height above the title (below the auto-sized title row).
 * Lower → less space above → title moves **up**. Must use real `fr` rows + `minmax(0,_)` so
 * `flex-[0.25]`-style hacks are not ignored (they often don’t distribute without `basis: 0` + `h-full`).
 */
const HERO_GRID_TOP_FR = 0.28;

/** Scrub timeline segment length for headline block `y` (baseline). */
const HERO_SCROLL_Y_DURATION_HEADLINE = 1;
/** Slightly longer so the CTA lags a touch under the same ScrollTrigger scrub. */
const HERO_SCROLL_Y_DURATION_CTA = 1.13;

/**
 * Landing hero: WebGL hills (hover + scroll camera), centered copy, scrubbed slide + fade.
 * Vertical bias uses CSS Grid `fr` rows (top spacer + main column with title, subtitle, CTA) so tuning
 * `HERO_GRID_TOP_FR` reliably moves the block. Headline and CTA share the same travel but slightly different scrub durations.
 */
const HERO_CTA_HREF = "/onboarding";

/** After initial boot reveal (`PageTransition` → `done`), pause before subtitle word stagger. */
const HERO_POST_REVEAL_SUBTITLE_DELAY_S = 0.12;
const HERO_SUBTITLE_TO_CTA_GAP_S = 0.14;

export function Hero() {
  const { t } = useLocale();
  const pageTransition = usePageTransition();
  const bootDone = pageTransition?.initialBootPhase === "done";
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroScrollGroupRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const heroCtaLayerRef = useRef<HTMLDivElement>(null);
  const pressedDuringHover = useRef(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ctaLabels = t.hero.ctaRotate;
  const ctaLabel = ctaLabels[ctaIndex % ctaLabels.length] ?? ctaLabels[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const ctaBlurTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  const subtitleWords = useMemo(
    () => t.hero.subtitle.trim().split(/\s+/).filter(Boolean),
    [t.hero.subtitle],
  );

  const subtitleWordBase = reducedMotion
    ? { duration: 0 as const }
    : { duration: 0.38 as const, ease: [0.22, 1, 0.36, 1] as const };
  const subtitleWordStagger = reducedMotion ? 0 : 0.045;

  const subtitleFirstWordDelay = reducedMotion ? 0 : HERO_POST_REVEAL_SUBTITLE_DELAY_S;

  const ctaFadeInDelay = useMemo(() => {
    if (reducedMotion) return 0;
    const n = subtitleWords.length;
    const subtitleEnd =
      HERO_POST_REVEAL_SUBTITLE_DELAY_S +
      (n > 0 ? (n - 1) * subtitleWordStagger + subtitleWordBase.duration : 0);
    return subtitleEnd + HERO_SUBTITLE_TO_CTA_GAP_S;
  }, [
    reducedMotion,
    subtitleWords.length,
    subtitleWordStagger,
    subtitleWordBase.duration,
  ]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const heroScrollGroup = heroScrollGroupRef.current;
    const heroCopy = heroCopyRef.current;
    const heroCtaLayer = heroCtaLayerRef.current;
    if (!section || !container || !heroScrollGroup || !heroCopy || !heroCtaLayer) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const travel = () => {
        const h = container.clientHeight;
        const th = heroScrollGroup.offsetHeight;
        return Math.max(0, (h - th) / 2);
      };

      gsap.set([heroCopy, heroCtaLayer], { y: 0 });
      gsap.set(heroScrollGroup, { opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom center",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        heroCopy,
        { y: travel, ease: "none", duration: HERO_SCROLL_Y_DURATION_HEADLINE },
        0,
      );
      tl.to(
        heroCtaLayer,
        { y: travel, ease: "none", duration: HERO_SCROLL_Y_DURATION_CTA },
        0,
      );
      tl.to(heroScrollGroup, { opacity: 0, ease: "none", duration: 0.25 }, 0.75);
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
      id="hero"
      ref={sectionRef}
      className={cn(
        "relative isolate flex min-h-svh w-full flex-col overflow-hidden bg-[#0a0a0a]",
        "px-4 pb-16 pt-28 md:px-6 lg:min-h-[120vh]",
      )}
    >
      <GLSLHills
        className={cn(
          "pointer-events-none absolute inset-0 z-0 h-full min-h-full w-full",
        )}
        interactionRootRef={sectionRef}
        width="100%"
        height="100%"
      />
      <div
        ref={containerRef}
        className={cn(
          "relative z-10 flex h-full min-h-0 w-full flex-1 flex-col items-center",
          "px-6 py-12 text-center md:py-16",
        )}
      >
        <div
          className="mx-auto grid h-full min-h-0 w-full max-w-4xl grid-cols-1 justify-items-stretch"
          style={{
            gridTemplateRows: `minmax(0,${HERO_GRID_TOP_FR}fr) minmax(0,1fr)`,
          }}
        >
          <div className="min-h-0 w-full" aria-hidden />
          <div
            ref={heroScrollGroupRef}
            className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col items-center text-center"
          >
            <div
              ref={heroCopyRef}
              className="flex w-full flex-col items-center will-change-transform"
            >
              <h1 className="mb-4 flex w-full flex-col items-center overflow-visible text-center text-5xl font-normal leading-[0.525] tracking-tight text-white md:text-7xl lg:text-8xl">
                <span className="block w-full text-center font-hero-bootzy">Mente</span>
                <span className="block w-full text-center font-hero-new-icon-script">
                  Maestra
                </span>
              </h1>

              <p className="w-full max-w-2xl text-center text-lg font-medium leading-snug tracking-tight text-white md:text-xl">
                {subtitleWords.map((word, i) => (
                  <Fragment key={`${i}-${word}`}>
                    {i > 0 ? " " : null}
                    <motion.span
                      className="inline-block will-change-[filter,opacity]"
                      initial={
                        reducedMotion
                          ? { opacity: 1, filter: "blur(0px)" }
                          : { opacity: 0, filter: "blur(10px)" }
                      }
                      animate={
                        reducedMotion || bootDone
                          ? { opacity: 1, filter: "blur(0px)" }
                          : { opacity: 0, filter: "blur(10px)" }
                      }
                      transition={{
                        ...subtitleWordBase,
                        delay: subtitleFirstWordDelay + i * subtitleWordStagger,
                      }}
                    >
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </p>
            </div>

            <div
              ref={heroCtaLayerRef}
              className="mt-auto flex w-full shrink-0 flex-col items-center pb-6 pt-10 will-change-transform md:pb-10 md:pt-14"
            >
              <motion.div
                className="flex w-full flex-col items-center"
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={
                  reducedMotion || bootDone ? { opacity: 1 } : { opacity: 0 }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.5,
                  delay: ctaFadeInDelay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={HERO_CTA_HREF}
                  className={cn(
                    "inline-flex min-w-[14rem] shrink-0 items-center justify-center gap-2 rounded-full bg-white/90 px-6 py-3 text-base font-medium text-black shadow-sm backdrop-blur-md transition-colors hover:bg-white/95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                  )}
                  aria-label={`${ctaLabel} — ${t.nav.cta}`}
                  onPointerEnter={() => {
                    pressedDuringHover.current = false;
                  }}
                  onPointerDown={() => {
                    pressedDuringHover.current = true;
                  }}
                  onPointerLeave={() => {
                    if (!pressedDuringHover.current) {
                      setCtaIndex((i) => (i + 1) % ctaLabels.length);
                    }
                  }}
                >
                  <span className="relative inline-grid min-h-[1.25em] min-w-[12rem] place-items-center overflow-visible">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={ctaIndex}
                        initial={
                          reducedMotion
                            ? { opacity: 1, filter: "blur(0px)" }
                            : { opacity: 0, filter: "blur(12px)" }
                        }
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={
                          reducedMotion
                            ? { opacity: 1, filter: "blur(0px)" }
                            : { opacity: 0, filter: "blur(12px)" }
                        }
                        transition={ctaBlurTransition}
                        className="col-start-1 row-start-1 inline-block will-change-[filter,opacity]"
                      >
                        {ctaLabel}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
