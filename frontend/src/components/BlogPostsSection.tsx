"use client";

import AnimatedCardStack from "@/components/ui/animate-card-animation";
import { useLocale } from "@/i18n/LocaleProvider";

/** Stable Unsplash assets (see `next.config.js` remotePatterns). */
const BLOG_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1504639725590-04d09843130e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
] as const;

export default function BlogPostsSection() {
  const { t } = useLocale();
  const copy = t.blogPosts;

  const posts = copy.items.map((item, i) => ({
    title: item.title,
    description: item.description,
    href: item.href,
    image: BLOG_COVER_IMAGES[i % BLOG_COVER_IMAGES.length],
  }));

  return (
    <section
      id="blog"
      aria-labelledby="blog-heading"
      className="relative border-t border-zinc-800/90 bg-[#0a0a0a] px-6 py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 flex justify-center">
            <span className="text-xs uppercase tracking-[0.2em] text-accent">
              {copy.eyebrow}
            </span>
          </div>
          <h2
            id="blog-heading"
            className="text-3xl font-bold text-white md:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="mt-4 text-balance text-sm leading-relaxed text-zinc-400 sm:text-base">
            {copy.subtitle}
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/40 px-2 py-6 sm:px-4">
          <AnimatedCardStack
            posts={posts}
            readLabel={copy.readCta}
            cycleLabel={copy.nextCta}
          />
        </div>
      </div>
    </section>
  );
}
