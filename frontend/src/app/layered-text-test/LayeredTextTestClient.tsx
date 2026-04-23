"use client";

import {
  LayeredText,
  MENTE_MAESTRA_DESIGN_STUDIO_LINES,
} from "@/components/ui/layered-text";

export default function LayeredTextTestClient() {
  return (
    <main className="dark min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex min-h-[80dvh] items-center justify-center px-4">
        <LayeredText
          lines={MENTE_MAESTRA_DESIGN_STUDIO_LINES}
          fontSize="clamp(2.25rem, 6vw, 4.5rem)"
          fontSizeMd="clamp(1.25rem, 4vw, 2rem)"
          lineHeight={72}
          lineHeightMd={42}
        />
      </div>
      <section className="mx-auto max-w-3xl px-6 py-12 text-sm text-white/55 md:px-10">
        <p>
          Route:{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">
            /layered-text-test
          </code>
          . Hover the stack to scrub the GSAP stagger. Component:{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">
            frontend/src/components/ui/layered-text.tsx
          </code>
          .
        </p>
      </section>
    </main>
  );
}
