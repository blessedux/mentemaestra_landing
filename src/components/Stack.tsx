"use client";

import Image from "next/image";
import { useLocale } from "@/i18n/LocaleProvider";

const BASE = "/imgs/stack_images";

/** Local stack logos — filenames match `public/imgs/stack_images`. */
const STACK_ITEMS = [
  {
    name: "Next.js",
    src: `${BASE}/39f54d8453cf0502b7fc74c1d9ad4d1bb005c697-1080x1080.webp`,
    wide: false,
  },
  {
    name: "Vercel",
    src: `${BASE}/vercel0.avif`,
    wide: false,
  },
  {
    name: "Three.js",
    src: `${BASE}/threjs.png`,
    wide: true,
  },
  {
    name: "Tailwind CSS",
    src: `${BASE}/68747470733a2f2f6431746c7a696664386a646f79342e636c6f756466726f6e742e6e65742f77702d636f6e74656e742f75706c6f6164732f323032322f30322f7461696c77696e646373732d65796563617463682d393630783530342e706e67.png`,
    wide: true,
  },
  {
    name: "GitHub",
    src: `${BASE}/maxresdefault.jpg`,
    wide: true,
  },
  {
    name: "Webpay",
    src: `${BASE}/webpay-logo-calado-5.jpg`,
    wide: true,
  },
] as const;

export default function Stack() {
  const { t } = useLocale();

  return (
    <section className="bg-zinc-900/50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-white" />
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {t.stack.label}
          </span>
        </div>
        <p className="mb-12 max-w-xl text-sm text-zinc-500">{t.stack.blurb}</p>

        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-10 md:gap-x-16 md:gap-y-12">
          {STACK_ITEMS.map((item) => (
            <div
              key={item.name}
              className="flex cursor-default items-center gap-3 text-zinc-400 opacity-80 transition-opacity hover:opacity-100"
            >
              <div
                className={`relative flex shrink-0 items-center justify-center ${
                  item.wide ? "h-10 w-[140px]" : "h-10 w-10"
                }`}
              >
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes={item.wide ? "140px" : "40px"}
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-300">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
