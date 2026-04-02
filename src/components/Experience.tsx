"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export default function Experience() {
  const { t } = useLocale();

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-4 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {t.experience.leftLabel}
                  </p>
                </div>
                <div>
                  <h3 className="max-w-sm text-3xl font-medium leading-tight text-white md:text-4xl">
                    {t.experience.leftTitle}
                  </h3>
                  <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
                    {t.experience.leftBody}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-16">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  {t.experience.stat1Label}
                </span>
              </div>
              <h3 className="mb-6 text-2xl font-medium md:text-3xl">
                {t.experience.stat1Title}
              </h3>
              <div className="border-t border-zinc-800 pt-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-light text-zinc-600 md:text-7xl">
                    5
                  </span>
                  <div className="text-xs uppercase tracking-[0.15em] text-zinc-500 whitespace-pre-line">
                    {t.experience.stat1Unit}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  {t.experience.stat2Label}
                </span>
              </div>
              <h3 className="mb-6 text-2xl font-medium md:text-3xl">
                {t.experience.stat2Title}
              </h3>
              <div className="border-t border-zinc-800 pt-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-light text-zinc-600 md:text-7xl">
                    32
                  </span>
                  <div className="text-xs uppercase tracking-[0.15em] text-zinc-500 whitespace-pre-line">
                    {t.experience.stat2Unit}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  {t.experience.stat3Label}
                </span>
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
