"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TextScramble } from "@/components/ui/text-scramble";
import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/messages";

function LangToggle({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1"
      role="group"
      aria-label="Idioma / Language"
    >
      {(["es", "en"] as const).map((code) => {
        const on = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded px-1.5 py-1 text-sm font-medium transition-colors ${
              on
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-400 dark:text-zinc-500"
            }`}
            aria-pressed={on}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

const navItemClass =
  "block w-fit rounded-sm py-0.5 text-left text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const navLinks = [
  { href: "/#design", labelKey: "design" as const },
  { href: "/#services", labelKey: "services" as const },
  { href: "/#works", labelKey: "works" as const },
  { href: "/#experience", labelKey: "experience" as const },
  { href: "/#book-meeting", labelKey: "book" as const },
  { href: "/#pricing", labelKey: "pricing" as const },
  { href: "/#faq", labelKey: "faq" as const },
];

export default function Header() {
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 sm:gap-10">
        <nav
          className="ml-[3%] mt-[3%] flex min-w-0 flex-col items-start gap-0.5"
          aria-label="Main"
        >
          {navLinks.map(({ href, labelKey }) => (
            <Link key={href} href={href} className={navItemClass}>
              <TextScramble
                text={t.nav[labelKey]}
                className="w-fit"
                labelClassName="font-mono text-sm font-medium tracking-widest uppercase text-inherit"
              />
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4">
          <LangToggle locale={locale} setLocale={setLocale} />
          <Link
            href="/#book-meeting"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 sm:px-5 sm:py-2.5"
          >
            {t.nav.cta}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
