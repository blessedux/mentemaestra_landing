"use client";

import { ArrowRight, Layers, Palette, Code2, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

const REVEAL_TOTAL_MS = 1000;

const ICONS: LucideIcon[] = [Layers, Palette, Code2, TrendingUp];

export default function Services() {
  const { t } = useLocale();
  const entries = [
    t.services.branding,
    t.services.design,
    t.services.code,
    t.services.growth,
  ] as const;

  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="text-4xl font-bold md:text-5xl">{t.services.title}</h2>
          <Link
            href="#"
            className="flex w-fit items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-sm text-white transition-colors hover:border-accent hover:text-accent"
          >
            {t.services.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="border-t border-zinc-800">
          {entries.map((service, index) => {
            const Icon = ICONS[index]!;
            return (
              <div
                key={service.title}
                className="service-card group flex cursor-pointer flex-col justify-between border-b border-zinc-800 py-8 md:flex-row md:items-center"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-12">
                  <h3 className="text-4xl font-bold tracking-tight transition-colors group-hover:text-accent md:text-6xl">
                    {service.title}
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                    {service.description.split(" ").map((word, wordIndex, words) => {
                      const maxDelay = REVEAL_TOTAL_MS - 300;
                      const delay =
                        words.length > 1
                          ? Math.round((wordIndex / (words.length - 1)) * maxDelay)
                          : 0;

                      return (
                        <span
                          key={`${service.title}-${word}-${wordIndex}`}
                          className="inline-block transition-colors duration-300 group-hover:text-white"
                          style={{ transitionDelay: `${delay}ms` }}
                        >
                          {word}
                          {wordIndex < words.length - 1 ? "\u00A0" : ""}
                        </span>
                      );
                    })}
                  </p>
                </div>
                <div className="mt-4 w-fit rounded-full border border-accent/30 p-3 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground md:mt-0">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
