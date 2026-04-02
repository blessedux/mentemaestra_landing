"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";

const AVATARS = [
  "https://media.licdn.com/dms/image/v2/D4E03AQEvUADyXWcsWg/profile-displayphoto-scale_400_400/B4EZkXNtfOHEAg-/0/1757031095862?e=1776902400&v=beta&t=qHo7FXhT0HfmWeeboyMSDZAOkrjgJmoF89IiuZFFY2w",
];

export default function Testimonials() {
  const { t } = useLocale();
  const items = t.testimonials.items;
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="flex justify-center lg:col-span-3 lg:justify-start">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full animate-spin-slow" viewBox="0 0 200 200">
                <defs>
                  <path
                    id="testimonialCircle"
                    d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                    fill="none"
                  />
                </defs>
                <text className="fill-white text-[13px] uppercase tracking-[0.25em]">
                  <textPath href="#testimonialCircle">{t.testimonials.badge}</textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-6xl text-white/90">&ldquo;&ldquo;</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <blockquote className="mb-8 text-2xl font-medium leading-relaxed text-white md:text-3xl lg:text-4xl">
              {items[currentIndex]?.quote}
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
                <img
                  src={AVATARS[currentIndex]}
                  alt={items[currentIndex]?.author ?? ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-white">{items[currentIndex]?.author}</p>
                <p className="text-sm text-zinc-400">{items[currentIndex]?.role}</p>
              </div>

              <div className="ml-auto flex gap-2">
                {items.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-white" : "bg-white/40"
                    }`}
                    aria-label={`Testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
