"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowUpRight } from "lucide-react";
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
      className="hidden items-center gap-1 md:flex"
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

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-1 md:gap-2">
        <Link
          href="/"
          aria-label="MenteMaestra home"
          className="group flex h-14 w-14 shrink-0 items-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900/80 px-[11px] backdrop-blur-sm transition-all duration-300 ease-out hover:w-[176px] hover:border-zinc-700"
        >
          <Image
            src="/MM_logo_NB-01.svg"
            alt="MenteMaestra logo"
            width={28}
            height={27}
            className="h-7 w-auto shrink-0"
            priority
          />
          <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap font-semibold tracking-tight text-white opacity-0 transition-all duration-300 ease-out group-hover:ml-2.5 group-hover:max-w-[118px] group-hover:opacity-100">
            MenteMaestra
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 backdrop-blur-sm md:flex">
          <Link
            href="#"
            className="rounded-full px-8 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
          >
            {t.nav.home}
          </Link>
          <Link
            href="#services"
            className="rounded-full px-8 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            {t.nav.studio}
          </Link>
          <Link
            href="#works"
            className="rounded-full px-8 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            {t.nav.works}
          </Link>
          <Link
            href="#pricing"
            className="rounded-full px-8 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            {t.nav.pricing}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LangToggle locale={locale} setLocale={setLocale} />
          <Link
            href="#contact"
            className="hidden h-14 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 md:flex"
          >
            {t.nav.cta}
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full p-2 text-white transition-colors hover:bg-zinc-800"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-zinc-950/95 backdrop-blur-lg md:hidden">
          <nav className="flex h-full flex-col items-center justify-center gap-8">
            <Link
              href="#"
              className="text-3xl font-semibold text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav.home}
            </Link>
            <Link
              href="#services"
              className="text-3xl font-semibold text-zinc-400 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav.studio}
            </Link>
            <Link
              href="#works"
              className="text-3xl font-semibold text-zinc-400 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav.works}
            </Link>
            <Link
              href="#pricing"
              className="text-3xl font-semibold text-zinc-400 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav.pricing}
            </Link>
            <div className="flex items-center gap-2">
              {(["es", "en"] as const).map((code) => {
                const on = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code)}
                    className={`rounded px-2 py-1 text-lg font-medium ${
                      on ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
            <Link
              href="#contact"
              className="mt-4 flex items-center gap-2 rounded-full bg-white px-8 py-3 text-lg font-medium text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              {t.nav.cta}
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
