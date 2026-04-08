"use client";

import { lazy, Suspense, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useLocale } from "@/i18n/LocaleProvider";

const DotOrbit = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.DotOrbit,
  })),
);

export default function OnboardingGlobeMapSection() {
  const { t } = useLocale();
  const copy = t.onboardingMap;
  const [hovered, setHovered] = useState(false);

  return (
    <section
      className="border-t border-zinc-800/80 bg-zinc-950/40 px-[20px] py-24"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-2 w-2 shrink-0 rounded-full bg-white" />
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                {copy.sectionLabel}
              </span>
            </div>
            <h2 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm text-zinc-500 md:text-base">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c0806] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
          <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#FF6500]/25 via-[#1a1008] to-[#0a0604]/95" aria-hidden />
          <div className="relative aspect-[16/10] min-h-[280px] w-full md:aspect-[2/1] md:min-h-[340px]">
            <Suspense
              fallback={<div className="absolute inset-0 bg-[#120a06]" aria-hidden />}
            >
              <div className="absolute inset-0 opacity-[0.92]">
                <DotOrbit
                  colorBack="#140c08"
                  colors={["#FF6500", "#f4f4f5", "#a1a1aa", "#ea580c"]}
                  size={0.38}
                  sizeRange={0.22}
                  spreading={0.55}
                  speed={hovered ? 0.85 : 0.35}
                  className="size-full"
                  minPixelRatio={1}
                />
              </div>
            </Suspense>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            {copy.cta}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
