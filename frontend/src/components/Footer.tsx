"use client";

import { faInstagram, faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GrainGradient } from "@paper-design/shaders-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { ParallaxComponent } from "@/components/ui/parallax-scrolling";
import { TextScramble } from "@/components/ui/text-scramble";

const FOOTER_SOCIAL_HREFS = {
  instagram: "https://instagram.com/mentemaestra.studio",
  x: "https://x.com/blessed_ux",
  linkedin: "https://www.linkedin.com/in/mentemaestradesignstudio/",
} as const;

const menuLinkClass =
  "block w-fit rounded-sm py-0.5 text-sm font-medium text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25";

const subheadingClass = "text-xs font-medium uppercase tracking-[0.2em] text-white/50";

const footerSocialIconStyle = { color: "rgb(255, 255, 255)" } as const;

function FooterPaperGradient({
  offsetX,
  offsetY,
  colors,
  intensity = 0.45,
  softness = 0.76,
  noise = 0,
  scale = 1,
  speed = 1,
  className,
}: {
  offsetX: number;
  offsetY: number;
  colors: string[];
  intensity?: number;
  softness?: number;
  noise?: number;
  scale?: number;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={["absolute inset-0", className].filter(Boolean).join(" ")}>
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(0, 0%, 0%)"
        softness={softness}
        intensity={intensity}
        noise={noise}
        shape="corners"
        offsetX={offsetX}
        offsetY={offsetY}
        scale={scale}
        rotation={0}
        speed={speed}
        colors={colors}
      />
    </div>
  );
}

export default function Footer() {
  const { t } = useLocale();

  const [autoOffset, setAutoOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // The drift cycle is ~2.4–3.1 s long; updating at ~12 fps (80 ms) is
    // imperceptibly smooth while avoiding React reconciliation every display frame.
    const start = performance.now();
    const id = setInterval(() => {
      const tms = performance.now() - start;
      setAutoOffset({
        x: Math.sin(tms / 2400) * 0.55,
        y: Math.cos(tms / 3100) * 0.45,
      });
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <footer
      id="contact"
      className="mm-footer relative overflow-hidden bg-[#0a0a0a]"
    >
      <ParallaxComponent>
        <div
          className="relative mt-auto flex w-full justify-center px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-28 md:px-10"
        >
          <div className="pointer-events-none absolute inset-0 z-0">
            {/* ── Mobile gradient (CSS-only, no WebGL) ───────────────────────
                iOS caps concurrent WebGL contexts at ~4. With GLSLHills
                disabled on mobile we still avoid exhausting the limit by
                replacing these three GrainGradient instances with pure-CSS
                radial gradients that approximate the warm orb effect.
            ─────────────────────────────────────────────────────────────── */}
            <div
              className="absolute inset-0 min-[981px]:hidden"
              style={{
                maskImage:
                  "linear-gradient(to top, black 0%, black 55%, transparent 86%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 0%, black 55%, transparent 86%)",
                background:
                  "radial-gradient(ellipse 110% 65% at 50% 115%, hsl(14 100% 57% / 0.55) 0%, hsl(340 82% 52% / 0.38) 35%, transparent 62%), radial-gradient(ellipse 80% 50% at 22% 112%, hsl(45 100% 51% / 0.42) 0%, transparent 52%)",
              }}
            />
            <div
              className="absolute inset-0 blur-2xl opacity-50 min-[981px]:hidden"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 35%, transparent 72%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 35%, transparent 72%)",
                background:
                  "radial-gradient(ellipse 100% 80% at 50% 0%, hsl(14 100% 57% / 0.5) 0%, hsl(340 82% 52% / 0.32) 42%, transparent 68%)",
              }}
            />

            {/* ── Desktop WebGL gradient (hidden on mobile) ─────────────── */}
            {/* Stack A — bottom-faded main palette with a single drifting tri-color layer. */}
            <div className="absolute inset-0 max-[980px]:hidden [mask-image:linear-gradient(to_top,black_0%,black_55%,transparent_86%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_55%,transparent_86%)]">
              <FooterPaperGradient
                offsetX={autoOffset.x * 0.35}
                offsetY={autoOffset.y * 0.3}
                colors={[
                  "hsl(14, 100%, 57%)",
                  "hsl(45, 100%, 51%)",
                  "hsl(340, 82%, 52%)",
                ]}
                intensity={0.45}
                softness={0.76}
                speed={1}
              />
              {/* Merged warm accent */}
              <FooterPaperGradient
                offsetX={0}
                offsetY={0}
                colors={["hsl(14, 100%, 57%)", "hsl(45, 100%, 51%)"]}
                intensity={0.18}
                softness={0.84}
                noise={0}
                scale={1}
                speed={1}
                className="opacity-35"
              />
              <div className="absolute inset-0 bg-black/18" />
            </div>

            {/* Stack B — heavy blur creates the "orb glow" at the top edge. */}
            <div className="absolute inset-0 max-[980px]:hidden blur-2xl opacity-55 [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_72%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_72%)]">
              <FooterPaperGradient
                offsetX={autoOffset.x * 0.18}
                offsetY={autoOffset.y * 0.14}
                colors={[
                  "hsl(14, 100%, 57%)",
                  "hsl(45, 100%, 51%)",
                  "hsl(340, 82%, 52%)",
                ]}
                intensity={0.28}
                softness={0.78}
                speed={0.9}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent" />
          </div>
          <div className="relative z-10 w-full max-w-7xl text-white">
            <div className="grid grid-cols-1 gap-12 sm:gap-14 lg:grid-cols-12 lg:gap-8 lg:gap-y-16">
              <div className="flex flex-col gap-5 lg:col-span-5">
                {/* Same multi-font logotype as `PortalFooter` / hero (bootzy + script + descriptor). */}
                <h2 className="m-0 inline-block text-[clamp(2.25rem,6vw,3.75rem)] font-normal leading-[0.78] tracking-tight text-white">
                  <Link
                    href="/"
                    className="block text-inherit no-underline transition hover:opacity-90"
                    aria-label="MenteMaestra home"
                  >
                    <span className="block font-hero-bootzy">{t.footer.titleLine1}</span>
                    <span className="block font-hero-new-icon-script">{t.footer.titleLine2}</span>
                  </Link>
                  <span className="mt-3 block w-full font-hero-bootzy text-[0.6rem] font-semibold tracking-[0.34em] text-zinc-400 uppercase">
                    {t.footer.designStudioLabel}
                  </span>
                </h2>
                <p className="max-w-sm text-sm leading-relaxed text-white/70">{t.footer.tagline}</p>
              </div>

              <div className="flex flex-col gap-10 lg:col-span-7 lg:flex-row lg:items-stretch lg:justify-end lg:gap-14">
                <div className="flex flex-col gap-10 lg:w-[22rem] lg:min-h-full">
                  <div className="flex flex-col gap-6 lg:items-start">
                    <p className={`${subheadingClass} mb-1`}>{t.footer.socialTitle}</p>
                    <ul className="flex flex-wrap items-center gap-4">
                      <li>
                        <a
                          href={FOOTER_SOCIAL_HREFS.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-white transition-opacity hover:opacity-80"
                          aria-label="Instagram"
                        >
                          <FontAwesomeIcon
                            icon={faInstagram}
                            style={footerSocialIconStyle}
                            className="h-5 w-5"
                          />
                        </a>
                      </li>
                      <li>
                        <a
                          href={FOOTER_SOCIAL_HREFS.x}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-white transition-opacity hover:opacity-80"
                          aria-label="X"
                        >
                          <FontAwesomeIcon
                            icon={faXTwitter}
                            style={footerSocialIconStyle}
                            className="h-5 w-5"
                          />
                        </a>
                      </li>
                      <li>
                        <a
                          href={FOOTER_SOCIAL_HREFS.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-white transition-opacity hover:opacity-80"
                          aria-label="LinkedIn"
                        >
                          <FontAwesomeIcon
                            icon={faLinkedinIn}
                            style={footerSocialIconStyle}
                            className="h-5 w-5"
                          />
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <p className={subheadingClass}>{t.footer.newsletterTitle}</p>
                    <form
                      className="flex flex-col gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="sr-only" htmlFor="footer-newsletter-email">
                          {t.footer.emailLabel}
                        </label>
                        <input
                          id="footer-newsletter-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder={t.footer.emailPlaceholder}
                          className="min-h-11 w-full min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm text-white outline-none ring-white/30 placeholder:text-white/40 focus:border-white/30 focus:ring-2"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                        >
                          {t.footer.subscribe}
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed text-white/45">{t.footer.newsletterHint}</p>
                    </form>
                  </div>
                </div>

                <nav
                  className="flex flex-col gap-4 lg:items-end lg:text-right"
                  aria-label={t.footer.menuTitle}
                >
                  <p className={subheadingClass}>{t.footer.menuTitle}</p>
                  <ul className="grid grid-flow-row grid-cols-2 gap-x-10 gap-y-1 lg:justify-items-end">
                    <li>
                      <Link href="/#design" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.design}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/#services" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.services}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/#works" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.works}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/#experience" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.experience}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/#book-meeting" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.book}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/pricing#pricing" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.pricing}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/pricing#faq" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.faq}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link href="/onboarding" className={menuLinkClass}>
                        <TextScramble
                          text={t.nav.cta}
                          className="w-fit"
                          labelClassName="text-sm font-medium text-inherit"
                        />
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="text-xs text-white/45">
                {t.footer.copyright} {t.footer.rights}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:justify-end">
                <Link
                  href="/privacy"
                  className="text-white/55 transition-colors hover:text-white"
                >
                  {t.footer.privacy}
                </Link>
                <Link
                  href="/terms"
                  className="text-white/55 transition-colors hover:text-white"
                >
                  {t.footer.terms}
                </Link>
                <a
                  href={`mailto:${t.footer.workEmail}`}
                  className="text-white/55 transition-colors hover:text-white"
                >
                  {t.footer.support}
                </a>
              </div>
            </div>
          </div>
        </div>
      </ParallaxComponent>
    </footer>
  );
}
