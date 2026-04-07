"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export default function Marquee() {
  const { t } = useLocale();
  const marqueeItems = [...t.marquee.items];

  return (
    <section className="overflow-hidden py-8">
      <div className="-rotate-1 scale-105 bg-accent py-4">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map(
            (item, index) => (
              <div key={index} className="mx-8 flex items-center">
                <span className="mr-6 h-2 w-2 rounded-full bg-white" />
                <span className="text-sm font-semibold uppercase tracking-wide text-white">
                  {item}
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="-mt-2 rotate-1 scale-105 bg-zinc-900 py-4">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map(
            (item, index) => (
              <div key={index} className="mx-8 flex items-center">
                <span className="mr-6 h-2 w-2 rounded-full bg-zinc-500" />
                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  {item}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
