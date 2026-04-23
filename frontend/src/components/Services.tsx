"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export default function Services() {
  const { t } = useLocale();
  const s = t.services;

  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold md:text-5xl">{s.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 md:text-lg">
              {s.subtitle}
            </p>
          </div>
          <Link
            href="/pricing#pricing"
            className="flex w-fit items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-sm text-white transition-colors hover:border-accent hover:text-accent"
          >
            {s.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="border-t border-zinc-800">
          {s.items.map((offer, index) => (
            <Link
              key={offer.id}
              href={offer.href}
              className="service-card group grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-zinc-800 py-10 md:gap-10 md:py-12"
            >
              <span className="mt-2 tabular-nums text-xs uppercase tracking-[0.2em] text-zinc-500 md:text-sm">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start md:gap-12">
                <h3 className="text-3xl font-bold tracking-tight transition-colors group-hover:text-accent md:text-5xl">
                  {offer.name}
                </h3>
                <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-400">
                  <p>
                    <span className="text-zinc-500">
                      {offer.forWhom}
                    </span>
                  </p>
                  <p className="text-zinc-300">{offer.outcome}</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                    {offer.cta}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              <span className="mt-2 hidden h-9 w-9 items-center justify-center rounded-full border border-accent/30 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground md:inline-flex">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
