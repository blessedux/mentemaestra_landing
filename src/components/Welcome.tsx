"use client";

import Image from "next/image";

import { MagicText } from "@/components/ui/magic-text";
import { useLocale } from "@/i18n/LocaleProvider";

export default function Welcome() {
  const { t } = useLocale();

  return (
    <section className="px-6 pb-24 pt-6 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 shrink-0 rounded-full bg-white" />
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                {t.welcome.label}
              </span>
            </div>
            <div className="relative aspect-[4000/2667] w-full max-w-xl overflow-hidden rounded-xl">
              <Image
                src="/pexels-pixabay-273230.webp"
                alt="Espacio de trabajo creativo"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42rem"
              />
            </div>
          </div>

          <div>
            <MagicText
              text={t.welcome.magicLead}
              className="flex flex-wrap"
              inactiveClassName="absolute inset-0 text-zinc-500"
              activeClassName="relative text-accent"
              highlightedWords={[...t.welcome.highlightsLead]}
              highlightedInactiveClassName="absolute inset-0 text-zinc-500"
              highlightedActiveClassName="relative text-white"
            />
            <h2 className="mt-6 max-w-4xl text-3xl font-medium leading-tight text-white md:text-4xl lg:text-5xl">
              {t.welcome.headline}
            </h2>
            <MagicText
              text={t.welcome.magicBody}
              className="mt-6 flex max-w-2xl flex-wrap"
              wordClassName="relative mr-2 mt-2 inline-flex text-lg leading-relaxed"
              inactiveClassName="absolute inset-0 text-zinc-500"
              activeClassName="relative text-white"
              highlightedWords={[...t.welcome.highlightsBody]}
              highlightedInactiveClassName="absolute inset-0 text-zinc-500"
              highlightedActiveClassName="relative text-accent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
