"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";

const BADGE_PATH_RADIUS = 75;
const BADGE_PATH_LENGTH = 2 * Math.PI * BADGE_PATH_RADIUS;

const BADGE_TEXT_CLASS =
  "fill-white text-[11px] font-medium md:text-[12px] [letter-spacing:normal] [font-feature-settings:normal]";

function splitBadgeYear(badge: string): { phrase: string; year: string } | null {
  const m = badge.match(/^(.*?)\s+(\d{4})\s*$/);
  if (!m) return null;
  const beforeYear = m[1].replace(/\s+$/, "");
  return { phrase: ` ${beforeYear} `, year: m[2] };
}

const SCROLL_SECTION_VH = 165;
const HERO_TEXT_SCROLL_DOWN_PX = 50;
const DESKTOP_MEDIA = "(min-width: 1024px)";

export default function Hero() {
  const { t, locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const yearMeasureRef = useRef<SVGTextElement>(null);
  const [phraseArcLength, setPhraseArcLength] = useState(
    BADGE_PATH_LENGTH - 36
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const phraseYear = useMemo(() => splitBadgeYear(t.hero.badge), [t.hero.badge]);

  const videoY = useTransform(scrollYProgress, (p) => {
    if (reduceMotion) return 0;
    const max =
      typeof window !== "undefined"
        ? Math.min(window.innerHeight * 0.42, 520)
        : 400;
    const eased = 1 - (1 - p) ** 1.35;
    return -eased * max;
  });

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA);
    const sync = () => setIsDesktopViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const heroTextY = useTransform(scrollYProgress, (p) => {
    if (reduceMotion || !isDesktopViewport) return 0;
    const eased = 1 - (1 - p) ** 1.35;
    return eased * HERO_TEXT_SCROLL_DOWN_PX;
  });

  useLayoutEffect(() => {
    if (!phraseYear) {
      setPhraseArcLength(BADGE_PATH_LENGTH);
      return;
    }
    const node = yearMeasureRef.current;
    if (!node) return;
    const yearLen = node.getComputedTextLength();
    setPhraseArcLength(Math.max(0, BADGE_PATH_LENGTH - yearLen));
  }, [phraseYear, locale]);

  return (
    <section
      ref={sectionRef}
      className="relative px-6 ring-2 ring-accent/70 ring-inset"
      style={{ height: `${SCROLL_SECTION_VH}vh` }}
    >
      <div className="sticky top-0 flex min-h-screen flex-col pb-3 pt-24 ring-2 ring-accent/50 ring-inset">
        <motion.div
          className="relative z-20 flex w-full flex-1 flex-col gap-8 will-change-transform lg:flex-row lg:items-start lg:justify-between lg:gap-10"
          style={{ y: heroTextY }}
        >
          <div className="relative min-w-0 max-w-2xl">
            <h1 className="relative z-10 w-max max-w-full text-6xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Mente
              <br />
              Maestra
            </h1>
            <p className="mt-6 max-w-xl text-xl font-medium tracking-tight text-zinc-300 md:text-2xl">
              {t.hero.subtitle}
            </p>
          </div>

          <div className="flex flex-col items-end self-end text-right lg:max-w-sm lg:shrink-0 lg:pt-8 xl:max-w-md">
            <p className="mb-8 max-w-md text-lg text-zinc-400">{t.hero.description}</p>

            <div className="group relative h-36 w-36 shrink-0 lg:h-44 lg:w-44">
              <svg
                className="h-full w-full animate-spin-slower motion-reduce:animate-none group-hover:[animation-play-state:paused]"
                viewBox="0 0 200 200"
              >
                <defs>
                  <path
                    id="circlePath"
                    d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                    fill="none"
                  />
                </defs>
                {phraseYear ? (
                  <>
                    <text
                      ref={yearMeasureRef}
                      className={`${BADGE_TEXT_CLASS} pointer-events-none select-none opacity-0`}
                      aria-hidden
                    >
                      <textPath href="#circlePath" startOffset={0}>
                        {phraseYear.year}
                      </textPath>
                    </text>
                    <text
                      className={BADGE_TEXT_CLASS}
                      textLength={phraseArcLength}
                      lengthAdjust="spacing"
                    >
                      <textPath href="#circlePath" startOffset={0}>
                        {phraseYear.phrase}
                      </textPath>
                    </text>
                    <text className={BADGE_TEXT_CLASS}>
                      <textPath
                        href="#circlePath"
                        startOffset={phraseArcLength}
                      >
                        {phraseYear.year}
                      </textPath>
                    </text>
                  </>
                ) : (
                  <text
                    className={BADGE_TEXT_CLASS}
                    textLength={BADGE_PATH_LENGTH}
                    lengthAdjust="spacing"
                  >
                    <textPath href="#circlePath">{t.hero.badge}</textPath>
                  </text>
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center md:h-[4.75rem] md:w-[4.75rem]">
                  <Image
                    src="/MM_logo_NB-01.svg"
                    alt=""
                    width={40}
                    height={39}
                    className="h-12 w-auto md:h-[3.35rem]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="relative z-10 mx-auto mt-8 w-full max-w-7xl will-change-transform md:mt-auto md:pt-6"
          style={{ y: videoY }}
        >
          <div className="overflow-hidden rounded-2xl bg-zinc-950/60">
            <div className="relative aspect-[16/9] lg:aspect-[21/9]">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="https://ik.imagekit.io/3bfeucft4/hero_8.m4v"
                autoPlay
                muted
                loop
                playsInline
                aria-hidden
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
