"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { GrainGradient } from "@paper-design/shaders-react";
import { TextScramble } from "@/components/ui/text-scramble";
import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";

function LangToggle({
  locale,
  setLocale,
  onLightSurface = false,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Dark controls when mobile menu (zinc panel) is open */
  onLightSurface?: boolean;
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
            className={cn(
              "rounded px-1.5 py-1 text-sm font-medium transition-colors",
              onLightSurface
                ? on
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-800"
                : on
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-400 dark:text-zinc-500",
            )}
            data-active={on ? "true" : "false"}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

/** Full-screen light panel: Bootzy + dark text on zinc-200 */
const mobilePanelNavItemClass =
  "font-hero-bootzy block w-fit rounded-md py-3 text-left text-2xl font-normal tracking-tight text-zinc-900 transition-colors hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-200 sm:py-3.5 sm:text-3xl";

const navLinks = [
  { href: "/#design", labelKey: "design" as const },
  { href: "/#services", labelKey: "services" as const },
  { href: "/#works", labelKey: "works" as const },
  { href: "/#experience", labelKey: "experience" as const },
  { href: "/#book-meeting", labelKey: "book" as const },
  { href: "/pricing#pricing", labelKey: "pricing" as const },
  { href: "/pricing#faq", labelKey: "faq" as const },
];

export default function Header() {
  const { locale, setLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** Nav CTA fades in only after the user scrolls past `#hero` (hidden on home hero). */
  const [navCtaVisible, setNavCtaVisible] = useState(false);
  const menuId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setNavCtaVisible(true);
      return undefined;
    }

    const update = () => {
      const { bottom } = hero.getBoundingClientRect();
      setNavCtaVisible(bottom <= 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    // Prevent horizontal "jump" when locking scroll (scrollbar disappears).
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [menuOpen]);

  const mobilePanelNavList = (
    <>
      {navLinks.map(({ href, labelKey }) => (
        <Link
          key={href}
          href={href}
          className={mobilePanelNavItemClass}
          onClick={closeMenu}
        >
          <TextScramble
            text={t.nav[labelKey]}
            className="w-fit"
            labelClassName="font-hero-bootzy text-inherit font-normal uppercase tracking-wide"
          />
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Full-screen light panel: slides up from bottom (CSS-only, GPU-friendly) */}
      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={locale === "es" ? "Menú principal" : "Main menu"}
        aria-hidden={!menuOpen}
        inert={mounted && !menuOpen ? true : undefined}
        className={cn(
          "fixed inset-0 z-40 flex min-h-[100dvh] flex-col overflow-y-auto bg-zinc-200/65 backdrop-blur-2xl backdrop-saturate-125",
          "transition-[transform,opacity] duration-[1040ms] ease-[cubic-bezier(0.86,0.01,0.77,0.78)]",
          "motion-reduce:transition-opacity motion-reduce:duration-400 motion-reduce:ease-out",
          menuOpen
            ? "translate-y-0 opacity-100 motion-reduce:translate-y-0"
            : "pointer-events-none translate-y-full opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-0",
        )}
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <GrainGradient
            style={{ height: "100%", width: "100%" }}
            colorBack="hsl(0, 0%, 92%)"
            softness={0.76}
            intensity={0.22}
            noise={0}
            shape="corners"
            offsetX={0}
            offsetY={0}
            scale={1}
            rotation={0}
            speed={0.95}
            colors={["hsl(14, 100%, 57%)", "hsl(45, 100%, 51%)", "hsl(340, 82%, 52%)"]}
          />
          <div className="absolute inset-0 bg-zinc-200/65" />
        </div>
        <nav
          className="flex min-h-0 flex-1 flex-col justify-center px-8 pb-16 pt-24 sm:px-14 sm:pb-20 sm:pt-28"
          aria-label="Main"
        >
          <div
            className={cn(
              "flex max-w-lg flex-col gap-1 sm:gap-2",
              "transition-[transform,opacity] duration-[600ms] ease-out",
              menuOpen
                ? "translate-y-0 opacity-100 delay-200 motion-reduce:delay-0"
                : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-0",
            )}
          >
            {mobilePanelNavList}
          </div>
        </nav>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 sm:gap-10">
          <div className="relative ml-[3%] flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/"
              onClick={closeMenu}
              className={cn(
                "shrink-0 rounded-md p-1.5 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                menuOpen
                  ? "opacity-95 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-zinc-200"
                  : "opacity-90 focus-visible:ring-white/25 focus-visible:ring-offset-transparent",
              )}
              aria-label={
                locale === "es" ? "Ir al inicio" : "Go to homepage"
              }
            >
              <Image
                src="/MM_logo_NB-01.svg"
                alt=""
                width={140}
                height={136}
                className={cn(
                  "h-7 w-auto sm:h-8",
                  menuOpen && "brightness-0",
                )}
                priority
              />
            </Link>
            <button
              type="button"
              className={cn(
                "-ml-0.5 rounded-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                menuOpen
                  ? "text-zinc-900 hover:bg-black/5 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-zinc-200"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white focus-visible:ring-white/25 focus-visible:ring-offset-transparent",
              )}
              data-expanded={menuOpen ? "true" : "false"}
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
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4">
            <LangToggle
              locale={locale}
              setLocale={setLocale}
              onLightSurface={menuOpen}
            />
            <div
              className={cn(
                "inline-flex shrink-0 transition-[opacity] duration-300 ease-out",
                navCtaVisible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              inert={!navCtaVisible ? true : undefined}
            >
              <Link
                href="/onboarding"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-zinc-100 sm:px-5 sm:py-2.5"
                onClick={closeMenu}
              >
                {t.nav.cta}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
