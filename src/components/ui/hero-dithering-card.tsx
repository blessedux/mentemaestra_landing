"use client";

import { lazy, Suspense, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
);

/** Alternate hero layout with Paper dithering shader; copy from `t.hero`. */
export function HeroDitheringCard() {
  const { t } = useLocale();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="flex w-full justify-center px-4 pb-12 pt-28 md:px-6">
      <div
        className="relative w-full max-w-7xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-[48px] border border-border bg-[#120a06] shadow-sm duration-500 md:min-h-[600px]">
          <div
            className="hero-bg-fade-in pointer-events-none absolute inset-0 z-[1]"
            aria-hidden
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#FF6500]/35 via-[#2a1810] to-[#0c0806]/90" />
            <Suspense
              fallback={<div className="absolute inset-0 bg-[#1a1208]" />}
            >
              <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.92]">
                <Dithering
                  colorBack="#241208"
                  colorFront="#FF6500"
                  shape="warp"
                  type="4x4"
                  speed={isHovered ? 0.6 : 0.2}
                  className="size-full"
                  minPixelRatio={1}
                />
              </div>
            </Suspense>
          </div>

          {/* Progressive bottom scrim: stacked blur bands + tint (stronger blur/dark toward bottom) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[min(62%,440px)] overflow-hidden rounded-b-[48px]"
            aria-hidden
          >
            <div className="hero-progressive-blur-band h-[32%] bg-gradient-to-t from-black/35 to-transparent backdrop-blur-[3px]" />
            <div className="hero-progressive-blur-band h-[48%] bg-gradient-to-t from-black/48 to-transparent backdrop-blur-[9px]" />
            <div className="hero-progressive-blur-band h-full bg-gradient-to-t from-black/72 via-black/28 to-transparent backdrop-blur-[20px] supports-[backdrop-filter]:backdrop-blur-[28px]" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {t.hero.badge}
            </div>

            <h2 className="mb-4 text-5xl font-medium leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
              <span className="hero-title-line-1 block">Mente</span>
              <span className="hero-title-line-2 block">Maestra</span>
            </h2>

            <p className="hero-support-line-1 mb-4 max-w-2xl text-lg font-medium leading-snug tracking-tight text-white md:text-xl">
              {t.hero.subtitle}
            </p>

            <p className="hero-support-line-2 max-w-2xl text-lg leading-relaxed text-white md:text-xl">
              {t.hero.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
