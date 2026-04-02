"use client";

import Image from "next/image";
import Link from "next/link";
import { Send } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer id="contact" className="bg-zinc-900/50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-6 text-sm text-zinc-400">{t.footer.newsletter}</p>
            <div className="mb-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-zinc-500">
                {t.footer.emailLabel}
              </label>
              <div className="flex items-center overflow-hidden rounded-lg bg-zinc-800">
                <input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
                <button type="button" className="p-3 text-zinc-400 transition-colors hover:text-white">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-600">
              {t.footer.privacyNote}
              <Link href="#" className="text-zinc-400 underline hover:text-white">
                {t.footer.privacyLink}
              </Link>
            </p>
          </div>

          <div>
            <h4 className="mb-6 font-semibold">{t.footer.workInquiry}</h4>
            <div className="space-y-2 text-zinc-400">
              <a
                href={`mailto:${t.footer.workEmail}`}
                className="block cursor-pointer transition-colors hover:text-white"
              >
                {t.footer.workEmail}
              </a>
              <a
                href={`tel:${t.footer.workPhone.replace(/\s/g, "")}`}
                className="block cursor-pointer transition-colors hover:text-white"
              >
                {t.footer.workPhone}
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-semibold">{t.footer.openPosition}</h4>
            <div className="space-y-2 text-zinc-400">
              <p className="cursor-pointer transition-colors hover:text-white">{t.footer.job1}</p>
              <p className="cursor-pointer transition-colors hover:text-white">{t.footer.job2}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="mb-4 font-semibold">{t.footer.locationTitle}</h4>
              <p className="whitespace-pre-line text-sm text-zinc-400">{t.footer.address}</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">{t.footer.linksTitle}</h4>
              <div className="space-y-2 text-zinc-400">
                <Link href="#" className="block transition-colors hover:text-white">
                  {t.footer.terms}
                </Link>
                <Link href="#" className="block transition-colors hover:text-white">
                  {t.footer.privacy}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-zinc-800 pt-8 md:flex-row">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="MenteMaestra home" className="shrink-0">
              <Image
                src="/MM_logo_NB-01.svg"
                alt="MenteMaestra logo"
                width={32}
                height={31}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-zinc-500">
              {t.footer.copyright}
              <br className="md:hidden" />
              <span className="hidden md:inline"> </span>
              {t.footer.rights}
            </p>
          </div>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="#" className="transition-colors hover:text-white">
              {t.nav.home}
            </Link>
            <Link href="#works" className="transition-colors hover:text-white">
              {t.nav.works}
            </Link>
            <Link href="#services" className="transition-colors hover:text-white">
              {t.nav.studio}
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-white">
              {t.nav.pricing}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
