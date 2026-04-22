"use client";

import { MagicText } from "@/components/ui/magic-text";
import { useLocale } from "@/i18n/LocaleProvider";

export default function Awards() {
  const { t } = useLocale();
  const awards = t.awards.list;

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white" />
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                {t.awards.label}
              </span>
            </div>
            <MagicText
              text={t.awards.magic1}
              className="flex flex-wrap"
              wordClassName="relative mr-3 mt-3 inline-flex text-3xl font-bold leading-tight md:text-4xl"
              inactiveClassName="absolute inset-0 text-zinc-600"
              activeClassName="relative text-zinc-400"
              highlightedWords={[...t.awards.highlights1]}
              highlightedInactiveClassName="absolute inset-0 text-zinc-600"
              highlightedActiveClassName="relative text-white"
            />
            <MagicText
              text={t.awards.magic2}
              className="mt-3 flex flex-wrap"
              wordClassName="relative mr-2 mt-2 inline-flex text-lg font-medium leading-relaxed"
              inactiveClassName="absolute inset-0 text-zinc-700"
              activeClassName="relative text-zinc-500"
              highlightedWords={[...t.awards.highlights2]}
              highlightedInactiveClassName="absolute inset-0 text-zinc-700"
              highlightedActiveClassName="relative text-accent"
            />
          </div>

          <div className="lg:col-span-8">
            <div className="flex justify-between border-b border-zinc-800 pb-4 text-xs uppercase tracking-[0.15em] text-zinc-500">
              <span>{t.awards.tableAward}</span>
              <span>{t.awards.tableDate}</span>
            </div>

            {awards.map((award, index) => (
              <div
                key={index}
                className="group flex cursor-pointer items-start justify-between border-b border-zinc-800 py-6 transition-colors hover:bg-zinc-900/50"
              >
                <div>
                  <p className="mb-1 text-xs text-zinc-500">{award.organization}</p>
                  <h3 className="text-lg font-medium transition-colors group-hover:text-accent">
                    {award.title}
                  </h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm text-zinc-500">{award.date}</span>
                  <button
                    type="button"
                    className="rounded-full border border-zinc-600 px-4 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-200"
                  >
                    here
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
