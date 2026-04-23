"use client";

import dynamic from "next/dynamic";

const GLSLHills = dynamic(() => import("@/components/GLSLHills"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-white/50">
      Loading WebGL…
    </div>
  ),
});

export default function ShaderHillsTestClient() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative h-[120vh] w-full overflow-hidden">
        <GLSLHills className="absolute inset-0 h-full w-full" width="100%" height="100%" />
        <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end px-6 pb-16 md:px-10 md:pb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Prototype</p>
          <h1 className="mt-2 max-w-xl text-3xl font-medium leading-tight md:text-4xl">
            GLSL hills at 120vh — overlay copy to judge hero readability.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-white/55">
            Scroll past this block to see how the extra 20vh feels against the rest of the page.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-16 text-sm text-white/60 md:px-10">
        <p>
          Route:{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">
            /shader-hills-test
          </code>
          . Component:{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">
            frontend/src/components/GLSLHills.tsx
          </code>
          .
        </p>
      </section>
    </main>
  );
}
