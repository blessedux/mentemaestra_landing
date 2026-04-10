"use client";

import { useMemo } from "react";

import { MagicText } from "@/components/ui/magic-text";
import ThreeDMarquee from "@/components/ui/3d-marquee";
import { useLocale } from "@/i18n/LocaleProvider";
import { portfolioProjects } from "@/data/portfolio-projects";

export default function FeaturedWorks() {
  const { t } = useLocale();

  const marqueeCards = useMemo(
    () =>
      portfolioProjects.map((p) => ({
        image: p.image,
        title: p.title,
        href: p.link,
      })),
    [],
  );

  return (
    <section id="works" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              {t.featured.label}
            </span>
          </div>
          <MagicText
            text={t.featured.magic}
            className="flex flex-wrap"
            wordClassName="relative mr-3 mt-3 inline-flex text-3xl font-medium leading-tight md:text-4xl"
            inactiveClassName="absolute inset-0 text-zinc-600"
            activeClassName="relative text-zinc-500"
            highlightedWords={[...t.featured.magicHighlights]}
            highlightedInactiveClassName="absolute inset-0 text-zinc-600"
            highlightedActiveClassName="relative text-white"
          />
        </div>

        {marqueeCards.length > 0 ? (
          <div className="-mx-2 sm:mx-0">
            <ThreeDMarquee cards={marqueeCards} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
