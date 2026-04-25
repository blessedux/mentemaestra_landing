"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import BookMeetingInline from "@/components/BookMeetingInline";
import { useLocale } from "@/i18n/LocaleProvider";

export default function BookMeetingSection() {
  const { t } = useLocale();
  const copy = t.book.section;
  const [beforeBookingOpen, setBeforeBookingOpen] = useState(false);

  return (
    <section
      id="book-meeting"
      className="relative border-t border-zinc-800/90 bg-[#0a0a0a] px-6 py-24"
    >
      <BookMeetingInline
        dialogAriaLabel={copy.title}
        intro={
          <>
            <div className="mb-10 text-center md:mb-12">
              <div className="mb-4 flex justify-center">
                <span className="text-xs uppercase tracking-[0.2em] text-accent">
                  {copy.eyebrow}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                {copy.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 md:text-base">
                {copy.subtitle}
              </p>
            </div>

            <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30 text-left md:mb-12">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
                onClick={() => setBeforeBookingOpen((v) => !v)}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {copy.qualificationTitle}
                </p>
                <ChevronDown
                  className={
                    beforeBookingOpen
                      ? "h-4 w-4 shrink-0 rotate-180 text-zinc-400 transition-transform"
                      : "h-4 w-4 shrink-0 rotate-0 text-zinc-400 transition-transform"
                  }
                  aria-hidden
                />
              </button>

              <div
                className={
                  beforeBookingOpen
                    ? "grid transition-[grid-template-rows] duration-300 ease-out [grid-template-rows:1fr]"
                    : "grid transition-[grid-template-rows] duration-300 ease-out [grid-template-rows:0fr]"
                }
                aria-hidden={beforeBookingOpen ? "false" : "true"}
              >
                <div
                  className={
                    beforeBookingOpen
                      ? "min-h-0 overflow-hidden px-6 pb-6 md:px-8 md:pb-8"
                      : "min-h-0 overflow-hidden px-0 pb-0"
                  }
                >
                  <div className="grid gap-6 md:grid-cols-2 md:gap-10">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                        {copy.idealForLabel}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                        {copy.idealFor.map((line) => (
                          <li key={line} className="flex gap-3">
                            <span
                              aria-hidden
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                            />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                        {copy.typicalLabel}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                        {copy.typicalProjects.map((line) => (
                          <li key={line} className="flex gap-3">
                            <span
                              aria-hidden
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500"
                            />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-6 border-t border-zinc-800/70 pt-4 text-xs leading-relaxed text-zinc-500">
                    <span className="font-semibold text-zinc-400">
                      {copy.notForLabel}:{" "}
                    </span>
                    {copy.notFor}
                  </p>
                </div>
              </div>
            </div>
          </>
        }
      />
    </section>
  );
}
