"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Minus, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export default function PricingFaq() {
  const { t, locale } = useLocale();
  const p = t.pricing;
  const faqMain = p.faq.filter((item) => item.id !== "hosting");
  const hostingFaq = p.faq.find((item) => item.id === "hosting");
  const faqFirstId = faqMain[0]?.id ?? null;
  const [openFaq, setOpenFaq] = useState<string | null>(faqFirstId);
  const [hostingOpen, setHostingOpen] = useState(true);

  useEffect(() => {
    const first = p.faq.find((item) => item.id !== "hosting") ?? p.faq[0];
    setOpenFaq(first?.id ?? null);
  }, [p.faq]);

  const toggleFaq = useCallback((id: string, wasOpen: boolean) => {
    setOpenFaq(wasOpen ? null : id);
  }, []);

  return (
    <>
      <section
        id="pricing"
        className="border-t border-zinc-800/80 bg-zinc-950/40 px-[20px] py-24"
      >
        <div className="w-full text-left">
          <div className="mb-12 flex flex-col gap-8 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-white" />
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  {p.sectionLabel}
                </span>
              </div>
              <h2 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">{p.title}</h2>
              <p className="mt-4 max-w-xl text-sm text-zinc-500 md:text-base">{p.subtitle}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {p.subscriptionTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  tier.popular
                    ? "border border-accent/50 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]"
                    : "border border-zinc-800 bg-zinc-950/40"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 right-6 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white md:right-8">
                    <Sparkles className="h-3 w-3" />
                    {p.mostPopular}
                  </div>
                )}
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
                  {tier.categoryLabel}
                </p>
                <h3 className="mt-4 flex flex-wrap items-center gap-2 text-xl font-bold text-white md:text-2xl">
                  {tier.name}
                  {tier.popular && (
                    <span className="text-accent" aria-hidden>
                      ★
                    </span>
                  )}
                </h3>
                <p className="mt-3 text-sm text-zinc-500">{tier.blurb}</p>

                <div className="mt-6">
                  {tier.tierKind === "project" ? (
                    <>
                      <p className="text-3xl font-bold tabular-nums md:text-4xl">
                        {tier.priceOneTime}{" "}
                        <span className="text-base font-semibold text-zinc-500 md:text-lg">
                          {tier.priceOneTimeLabel}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">{tier.priceOneTimeNote}</p>
                      <p className="mt-6 text-2xl font-bold tabular-nums md:text-3xl">
                        {tier.yearlyMaintenance}{" "}
                        <span className="text-base font-semibold text-zinc-500 md:text-lg">
                          {tier.yearlyMaintenanceLabel}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">{tier.yearlyMaintenanceNote}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold tabular-nums md:text-4xl">
                        {tier.priceMonthly}{" "}
                        <span className="text-base font-semibold text-zinc-500 md:text-lg">
                          {locale === "es" ? p.priceMonthlyClp : p.priceMonthlyUsd}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">{tier.priceNote}</p>
                    </>
                  )}
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-zinc-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>

                {tier.popular && (
                  <p className="mt-6 border-t border-zinc-800 pt-6 text-sm italic text-zinc-400">
                    {p.subTagline}
                  </p>
                )}

                <Link
                  href="/#book-meeting"
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition ${
                    tier.popular
                      ? "bg-accent text-white hover:opacity-95"
                      : "border border-zinc-600 text-white hover:border-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  {tier.tierKind === "project" ? p.projectCta : p.subCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-left text-xs text-zinc-600">
            {p.subFootnote}
            <span className="text-zinc-400">{p.alaCarteAmount}</span>
            {p.subFootnoteEnd}
          </p>

          <div className="mt-16 text-left">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
                {p.oneTime}
              </span>
            </div>
            <p className="mb-6 max-w-3xl text-sm text-zinc-500">{p.oneTimeBlurb}</p>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                      <th className="px-4 py-3 font-medium">{p.tableService}</th>
                      <th className="px-4 py-3 font-medium">{p.tableUsd}</th>
                      <th className="px-4 py-3 font-medium">{p.tableClp}</th>
                      <th className="px-4 py-3 font-medium">{p.tableIncludes}</th>
                      <th className="px-4 py-3 font-medium">{p.tableNotIncluded}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.projectRows.map((row, i) => (
                      <tr
                        key={row.service}
                        className={`border-b border-zinc-800/90 last:border-0 ${
                          row.popular
                            ? "bg-accent/[0.06] ring-1 ring-inset ring-accent/20"
                            : "hover:bg-zinc-900/50"
                        }`}
                      >
                        <td className="px-4 py-4 align-top font-medium text-white">
                          <span className="flex flex-col gap-1">
                            {row.service}
                            {row.popular && (
                              <span className="w-fit rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                                {p.projectsPopular}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top tabular-nums text-zinc-300">
                          {p.usdAmounts[i]}
                        </td>
                        <td className="px-4 py-4 align-top tabular-nums text-zinc-400">
                          {p.clpAmounts[i]}
                        </td>
                        <td className="max-w-[220px] px-4 py-4 align-top text-zinc-400">
                          {row.includes}
                        </td>
                        <td className="max-w-[160px] px-4 py-4 align-top text-zinc-500">
                          {row.notIncluded}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-4xl text-center">
            <div className="mx-auto grid w-full max-w-4xl justify-items-center gap-8 text-center md:grid-cols-2 md:gap-10">
              <div className="w-full max-w-md">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  {p.websitesTitle}
                </h3>
                <p className="mt-3 text-sm text-zinc-400">{p.websitesIntro}</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  {p.websitesWeeks.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="w-full max-w-md">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  {p.subColumnTitle}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  {p.subBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center md:p-8">
              <h3 className="text-lg font-semibold text-white">{p.alaCarteTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {p.alaCarteA}
                <strong className="font-semibold text-zinc-200">{p.alaCarteAmount}</strong>
                {p.alaCarteB}
                <span className="text-accent">{p.alaCarteProduct}</span>
                {p.alaCarteC}
              </p>
              <p className="mt-4 text-sm text-zinc-500">
                {p.alaCarteHint}
                <span className="text-zinc-300">{p.alaCarteHintBold}</span>
              </p>
            </div>

            <div className="mt-10 text-left">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                {p.howToChoose}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                {p.howToChooseItems.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="text-accent">→</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {hostingFaq && (
              <div className="mt-10 text-left">
                <div
                  className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                    hostingOpen ? "border-accent/40 bg-zinc-900/80" : "border-zinc-800 bg-zinc-900/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setHostingOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-medium text-white">{hostingFaq.q}</span>
                    <span
                      className={`shrink-0 transition-colors duration-300 ${hostingOpen ? "text-accent" : "text-zinc-500"}`}
                    >
                      {hostingOpen ? (
                        <Minus className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <Plus className="h-5 w-5" strokeWidth={2} />
                      )}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      hostingOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div
                        className={`border-t border-zinc-800/80 px-5 pb-5 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                          hostingOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                        }`}
                      >
                        <p className="pt-4 text-sm leading-relaxed text-zinc-400">{hostingFaq.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/#book-meeting"
              className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-medium text-white transition hover:border-zinc-400 hover:bg-zinc-900"
            >
              {p.talkScope}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="border-t border-zinc-800/80 px-6 py-24"
      >
        <div className="mx-auto max-w-3xl text-left">
          <h2 className="text-4xl font-bold md:text-5xl">
            {p.faqTitle}
            <span className="text-accent">{p.faqTitleAccent}</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm text-zinc-500">{p.faqSubtitle}</p>

          <div className="mt-12 space-y-3">
            {faqMain.map((item) => {
              const open = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                    open ? "border-accent/40 bg-zinc-900/80" : "border-zinc-800 bg-zinc-900/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(item.id, open)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-medium text-white">{item.q}</span>
                    <span className={`shrink-0 transition-colors duration-300 ${open ? "text-accent" : "text-zinc-500"}`}>
                      {open ? <Minus className="h-5 w-5" strokeWidth={2} /> : <Plus className="h-5 w-5" strokeWidth={2} />}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div
                        className={`border-t border-zinc-800/80 px-5 pb-5 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                          open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                        }`}
                      >
                        <p className="pt-4 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
