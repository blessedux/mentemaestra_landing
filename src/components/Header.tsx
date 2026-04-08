"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { TextScramble } from "@/components/ui/text-scramble";
import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";

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

const MD_UP_QUERY = "(min-width: 768px)";

function subscribeMdUp(onChange: () => void) {
  const mq = window.matchMedia(MD_UP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useMdUp() {
  return useSyncExternalStore(
    subscribeMdUp,
    () => window.matchMedia(MD_UP_QUERY).matches,
    () => true,
  );
}

const navLinks = [
  { href: "/#design", labelKey: "design" as const },
  { href: "/#services", labelKey: "services" as const },
  { href: "/#works", labelKey: "works" as const },
  { href: "/#experience", labelKey: "experience" as const },
  { href: "/#book-meeting", labelKey: "book" as const },
  { href: "/onboarding#pricing", labelKey: "pricing" as const },
  { href: "/onboarding#faq", labelKey: "faq" as const },
];

export default function Header() {
  const { locale, setLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuId = useId();
  const mdUp = useMdUp();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mdUp && menuOpen) setMenuOpen(false);
  }, [mdUp, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen || mdUp) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, mdUp]);

  const navLinkList = (
    <>
      {navLinks.map(({ href, labelKey }) => (
        <Link
          key={href}
          href={href}
          className={navItemClass}
          onClick={closeMenu}
        >
          <TextScramble
            text={t.nav[labelKey]}
            className="w-fit"
            labelClassName="font-mono text-sm font-medium tracking-widest uppercase text-inherit"
          />
        </Link>
      ))}
    </>
  );

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          aria-label={locale === "es" ? "Cerrar menú" : "Close menu"}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] md:hidden"
          onClick={closeMenu}
        />
      ) : null}

      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-6 sm:gap-10">
          <div className="relative ml-[3%] mt-[3%] flex min-w-0 flex-col items-start">
            <button
              type="button"
              className="mb-1 -ml-1.5 rounded-md p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={
                menuOpen
                  ? locale === "es"
                    ? "Cerrar navegación"
                    : "Close navigation"
                  : locale === "es"
                    ? "Abrir navegación"
                    : "Open navigation"
              }
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <X className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              )}
            </button>

            <nav
              id={menuId}
              className={cn(
                "flex min-w-0 flex-col items-start gap-0.5",
                "origin-top transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
                "md:relative md:mt-0 md:max-h-none md:scale-y-100 md:opacity-100",
                "max-md:absolute max-md:left-0 max-md:top-full max-md:z-50 max-md:mt-1 max-md:w-[min(90vw,18rem)] max-md:rounded-lg max-md:border max-md:border-white/10 max-md:bg-[#0a0a0a]/95 max-md:px-3 max-md:py-3 max-md:shadow-lg max-md:backdrop-blur-md",
                menuOpen
                  ? "max-md:scale-y-100 max-md:opacity-100"
                  : "max-md:pointer-events-none max-md:scale-y-0 max-md:opacity-0",
              )}
              aria-label="Main"
              inert={mounted && !mdUp && !menuOpen ? true : undefined}
            >
              {navLinkList}
            </nav>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4">
            <LangToggle locale={locale} setLocale={setLocale} />
            <Link
              href="/onboarding"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 sm:px-5 sm:py-2.5"
              onClick={closeMenu}
            >
              {t.nav.cta}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
