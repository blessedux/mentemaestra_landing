"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";

import { MagicText } from "@/components/ui/magic-text";
import ThreeDMarquee from "@/components/ui/3d-marquee";
import { useLocale } from "@/i18n/LocaleProvider";
import {
  featuredProjectHighlights,
  getFeaturedProjects,
} from "@/data/portfolio-projects";

export default function FeaturedWorks() {
  const { t, locale } = useLocale();

  const featured = useMemo(() => getFeaturedProjects(), []);
  const marqueeCards = useMemo(
    () =>
      featured.map((p) => ({
        image: p.image,
        title: p.title,
        href: p.link,
      })),
    [featured],
  );

  const projectsByTitle = useMemo(
    () => new Map(featured.map((p) => [p.title, p])),
    [featured],
  );

  return (
    <section
      id="works"
      className="relative z-[2] overflow-visible pt-24 pb-8 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative z-40 mb-12 grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white" />
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                {t.featured.label}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400 md:text-base">
              {t.featured.intro}
            </p>
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
          <div className="relative z-10 -mt-20 left-1/2 w-screen max-w-[100vw] -translate-x-1/2 md:-mt-28 lg:-mt-40">
            <ThreeDMarquee cards={marqueeCards} className="rounded-none" />
          </div>
        ) : null}

        <ul className="relative z-20 mt-12 mb-4 divide-y divide-zinc-800/80 border-y border-zinc-800/80 md:mb-12 lg:mt-14">
          {featuredProjectHighlights.map((h) => {
            const project = projectsByTitle.get(h.title);
            if (!project) return null;
            return (
              <li key={h.title}>
                <Link
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid grid-cols-[1fr_auto] items-start gap-4 py-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-10 md:py-7"
                >
                  <span className="text-lg font-medium text-white md:text-xl">
                    {h.title}
                  </span>
                  <span className="hidden text-sm leading-relaxed text-zinc-400 md:block">
                    {h.jobToBeDone[locale]}
                  </span>
                  <span className="col-span-2 text-sm leading-relaxed text-zinc-300 md:col-span-1">
                    <span className="md:hidden text-zinc-400">
                      {h.jobToBeDone[locale]}
                      <br />
                    </span>
                    {h.outcome[locale]}
                  </span>
                  <span className="row-span-2 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors group-hover:border-accent group-hover:text-accent md:row-span-1">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[25%] bg-gradient-to-t from-[#030303] to-transparent"
        aria-hidden
      />
    </section>
  );
}
