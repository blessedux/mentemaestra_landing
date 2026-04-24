"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type MotionValue,
} from "motion/react";

import { useLocale } from "@/i18n/LocaleProvider";
import { portfolioProjects } from "@/data/portfolio-projects";

const Brain3dExperience = dynamic(
  () => import("@/components/Brain3dExperience"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full min-h-[200px] animate-pulse bg-zinc-950/50"
        aria-hidden
      />
    ),
  }
);

/** Same scroll window as `MagicText` (Welcome highlighted words). */
const SCROLL_OFFSET = ["start 0.9", "start 0.25"] as const;

const COUNT_DURATION_MS = 1400;

/** Studio was founded in 2022; stat1 shows real years, never 0. */
const STUDIO_FOUNDED_YEAR = 2022;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function ScrollRevealStatLabel({
  children,
  scrollYProgress,
  range,
}: {
  children: React.ReactNode;
  scrollYProgress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(scrollYProgress, range, [0, 1], { clamp: true });
  return (
    <span className="relative inline-flex text-xs uppercase tracking-[0.2em]">
      <span className="absolute inset-0 text-zinc-400">{children}</span>
      <motion.span style={{ opacity }} className="relative text-accent">
        {children}
      </motion.span>
    </span>
  );
}

function CountUpNumber({
  target,
  active,
}: {
  target: number;
  active: boolean;
}) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_DURATION_MS);
      setCount(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  return (
    <span className="tabular-nums text-6xl font-light text-accent md:text-7xl">
      {count}
    </span>
  );
}

export default function Experience() {
  const { t } = useLocale();
  const sectionRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: [...SCROLL_OFFSET],
  });

  const stat1BlockRef = React.useRef<HTMLDivElement>(null);
  const stat2BlockRef = React.useRef<HTMLDivElement>(null);
  const brainStripRef = React.useRef<HTMLDivElement>(null);

  const stat1InView = useInView(stat1BlockRef, { amount: 0.35, once: false });
  const stat2InView = useInView(stat2BlockRef, { amount: 0.35, once: false });
  const brainShouldLoad = useInView(brainStripRef, { amount: 0.08, once: true });

  const stat1Range: [number, number] = [0, 1 / 3];
  const stat2Range: [number, number] = [1 / 3, 2 / 3];
  const stat3Range: [number, number] = [2 / 3, 1];

  const projectsShipped = portfolioProjects.length;
  const yearsAsStudio = Math.max(
    1,
    new Date().getFullYear() - STUDIO_FOUNDED_YEAR,
  );

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="relative bg-[#030303] px-6 py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <div
                ref={brainStripRef}
                className="relative h-[220px] shrink-0 border-b border-zinc-800/90 sm:h-[260px] md:h-[300px]"
              >
                {brainShouldLoad ? (
                  <Brain3dExperience
                    className="min-h-0 bg-[#030303]"
                    thoughts={t.experience.brainThoughts}
                    thoughtsOverlayClassName="top-11 justify-center pt-1 md:top-12 md:pt-0"
                  />
                ) : (
                  <div
                    className="h-full min-h-[200px] animate-pulse bg-zinc-950/50"
                    aria-hidden
                  />
                )}
                <div className="pointer-events-none absolute left-0 top-0 z-30 flex max-w-[min(100%,20rem)] items-start gap-3 p-4 pr-3">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <p className="text-left text-[11px] font-medium uppercase leading-snug tracking-[0.18em] text-zinc-100 shadow-black/90 drop-shadow-[0_1px_12px_rgba(0,0,0,0.9)] sm:text-xs sm:tracking-[0.2em]">
                    {t.experience.leftLabel}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-8 pt-7">
                <h3 className="max-w-sm text-3xl font-medium leading-tight text-white md:text-4xl">
                  {t.experience.leftTitle}
                </h3>
                <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
                  {t.experience.leftBody}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-16">
            <div ref={stat1BlockRef}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <ScrollRevealStatLabel
                  scrollYProgress={scrollYProgress}
                  range={stat1Range}
                >
                  {t.experience.stat1Label}
                </ScrollRevealStatLabel>
              </div>
              <h3 className="mb-6 text-2xl font-medium md:text-3xl">
                {t.experience.stat1Title}
              </h3>
              <div className="border-t border-zinc-800 pt-6">
                <div className="flex items-baseline gap-4">
                  <CountUpNumber target={yearsAsStudio} active={stat1InView} />
                  <div className="text-xs uppercase tracking-[0.15em] text-zinc-500 whitespace-pre-line">
                    {t.experience.stat1Unit}
                  </div>
                </div>
              </div>
            </div>

            <div ref={stat2BlockRef}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <ScrollRevealStatLabel
                  scrollYProgress={scrollYProgress}
                  range={stat2Range}
                >
                  {t.experience.stat2Label}
                </ScrollRevealStatLabel>
              </div>
              <h3 className="mb-6 text-2xl font-medium md:text-3xl">
                {t.experience.stat2Title}
              </h3>
              <div className="border-t border-zinc-800 pt-6">
                <div className="flex items-baseline gap-4">
                  <CountUpNumber target={projectsShipped} active={stat2InView} />
                  <div className="text-xs uppercase tracking-[0.15em] text-zinc-500 whitespace-pre-line">
                    {t.experience.stat2Unit}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <ScrollRevealStatLabel
                  scrollYProgress={scrollYProgress}
                  range={stat3Range}
                >
                  {t.experience.stat3Label}
                </ScrollRevealStatLabel>
              </div>
              <h3 className="mb-6 text-2xl font-medium md:text-3xl">
                {t.experience.stat3Title}
              </h3>
              <div className="border-t border-zinc-800 pt-6">
                <p className="max-w-md text-base leading-relaxed text-zinc-400">
                  {t.experience.stat3Body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
