"use client";

import { faInstagram, faLinkedinIn, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { ParallaxComponent } from "@/components/ui/parallax-scrolling";

/** Replace with real profile URLs when ready. */
const FOOTER_SOCIAL_HREFS = {
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
  linkedin: "https://www.linkedin.com/",
} as const;

const menuLinkClass =
  "block w-fit rounded-sm py-0.5 text-sm font-medium text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25";

const subheadingClass = "text-xs font-medium uppercase tracking-[0.2em] text-white/50";

const footerSocialIconStyle = { color: "rgb(255, 255, 255)" } as const;

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer id="contact" className="bg-[#0a0a0a]">
      <ParallaxComponent>
        <div className="mt-auto flex w-full justify-center px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-28 md:px-10">
          <div className="w-full max-w-7xl text-white">
            <div className="grid grid-cols-1 gap-12 sm:gap-14 lg:grid-cols-12 lg:gap-8 lg:gap-y-16">
              <div className="flex flex-col gap-5 lg:col-span-4">
                {/* Same multi-font logotype as `PortalFooter` / hero (bootzy + script + descriptor). */}
                <h2 className="m-0 text-[clamp(2.25rem,6vw,3.75rem)] font-normal leading-[0.52] tracking-tight text-white">
                  <Link
                    href="/"
                    className="block text-inherit no-underline transition hover:opacity-90"
                    aria-label="MenteMaestra home"
                  >
                    <span className="block font-hero-bootzy">{t.footer.titleLine1}</span>
                    <span className="block font-hero-new-icon-script">{t.footer.titleLine2}</span>
                  </Link>
                  <span className="mt-2 block w-full font-hero-bootzy text-[0.42rem] tracking-[0.38em] text-zinc-600 uppercase">
                    {t.footer.designStudioLabel}
                  </span>
                </h2>
                <p className="max-w-sm text-sm leading-relaxed text-white/70">{t.footer.tagline}</p>
              </div>

              <nav className="flex flex-col gap-4 lg:col-span-2" aria-label={t.footer.menuTitle}>
                <p className={subheadingClass}>{t.footer.menuTitle}</p>
                <ul className="flex flex-col gap-1">
                  <li>
                    <Link href="/#design" className={menuLinkClass}>
                      {t.nav.design}
                    </Link>
                  </li>
                  <li>
                    <Link href="/#services" className={menuLinkClass}>
                      {t.nav.services}
                    </Link>
                  </li>
                  <li>
                    <Link href="/#works" className={menuLinkClass}>
                      {t.nav.works}
                    </Link>
                  </li>
                  <li>
                    <Link href="/#experience" className={menuLinkClass}>
                      {t.nav.experience}
                    </Link>
                  </li>
                  <li>
                    <Link href="/#book-meeting" className={menuLinkClass}>
                      {t.nav.book}
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing#pricing" className={menuLinkClass}>
                      {t.nav.pricing}
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing#faq" className={menuLinkClass}>
                      {t.nav.faq}
                    </Link>
                  </li>
                  <li>
                    <Link href="/onboarding" className={menuLinkClass}>
                      {t.nav.cta}
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="flex flex-col gap-4 lg:col-span-3">
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

              <div className="flex flex-col gap-6 lg:col-span-3 lg:items-end lg:text-right">
                <p className={`${subheadingClass} mb-4`}>{t.footer.socialTitle}</p>
                <ul className="flex flex-wrap items-center gap-4 lg:justify-end">
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
      <div className="flex justify-center border-t border-zinc-800 bg-[#0a0a0a] px-6 py-10">
        <Link
          href="/"
          aria-label="MenteMaestra home"
          className="opacity-90 transition-opacity hover:opacity-100"
        >
          <Image
            src="/MM_logo_NB-01.svg"
            alt="MenteMaestra"
            width={140}
            height={136}
            className="h-16 w-auto"
            priority={false}
          />
        </Link>
      </div>
    </footer>
  );
}
