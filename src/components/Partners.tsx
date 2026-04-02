"use client";

import { Github, ShoppingBag } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";

function NextLogo() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current">
      <span className="text-[13px] font-bold leading-none">N</span>
    </div>
  );
}

function VercelMark() {
  return (
    <div
      className="h-0 w-0 shrink-0 border-x-[9px] border-x-transparent border-b-[16px] border-b-current"
      aria-hidden
    />
  );
}

function ThreeJsMark() {
  return (
    <div className="flex shrink-0 flex-col justify-center gap-1" aria-hidden>
      <div className="h-px w-8 bg-current opacity-90" />
      <div className="mx-auto h-px w-6 bg-current opacity-70" />
      <div className="mx-auto h-px w-4 bg-current opacity-50" />
    </div>
  );
}

function SanityMark() {
  return (
    <div className="flex h-9 shrink-0 items-end justify-center gap-1" aria-hidden>
      <span className="h-3 w-1.5 rounded-full bg-accent" />
      <span className="h-5 w-1.5 rounded-full bg-accent" />
      <span className="h-3.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}

function TailwindMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 w-10 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3.5 12c1.5-3 5-3.5 7.5-1.5s4.5 4 7.5 4 5-2 6-3.5" />
      <path d="M6 17.5c1.5-2.5 4-3 6.5-1.5s4 3.5 6.5 3.5" opacity="0.65" />
    </svg>
  );
}

export default function Partners() {
  const { t } = useLocale();

  return (
    <section className="bg-zinc-900/50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-white" />
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {t.partners.label}
          </span>
        </div>
        <p className="mb-12 max-w-xl text-sm text-zinc-500">{t.partners.blurb}</p>

        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-10 md:gap-x-16 md:gap-y-12">
          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-white">
            <NextLogo />
            <span className="text-sm font-semibold tracking-tight">Next.js</span>
          </div>

          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-white">
            <VercelMark />
            <span className="text-sm font-semibold tracking-tight">Vercel</span>
          </div>

          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-white">
            <ThreeJsMark />
            <span className="text-sm font-semibold tracking-tight">Three.js</span>
          </div>

          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-white">
            <SanityMark />
            <span className="text-sm font-semibold tracking-tight">Sanity</span>
          </div>

          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-white">
            <TailwindMark />
            <span className="text-sm font-semibold tracking-tight">Tailwind CSS</span>
          </div>

          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-white">
            <Github className="h-10 w-10 shrink-0" strokeWidth={1.25} />
            <span className="text-sm font-semibold tracking-tight">GitHub</span>
          </div>

          <div className="flex cursor-default items-center gap-3 text-zinc-400 transition-colors hover:text-yellow-400">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current bg-yellow-400/5">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Mercado Libre</span>
          </div>
        </div>
      </div>
    </section>
  );
}
