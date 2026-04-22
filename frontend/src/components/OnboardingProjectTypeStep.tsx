"use client";

import { useLocale } from "@/i18n/LocaleProvider";

const TYPE_KEYS = ["web", "product", "brand", "other"] as const;

export default function OnboardingProjectTypeStep() {
  const { t } = useLocale();
  const o = t.onboarding;

  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] flex-col justify-center px-5 pb-24 pt-28 sm:px-8 md:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          {o.stepLabel}
        </p>
        <h1 className="text-balance text-3xl font-bold leading-tight text-white md:text-4xl">
          {o.question}
        </h1>
        <p className="mt-3 text-sm text-zinc-500 md:text-base">{o.hint}</p>

        <ul className="mt-10 flex flex-col gap-3">
          {TYPE_KEYS.map((key) => (
            <li key={key}>
              <button
                type="button"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-left text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:text-base"
              >
                {o.types[key]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
