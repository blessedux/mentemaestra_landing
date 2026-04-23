"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";

import { PageTransitionProvider } from "@/components/PageTransition";
import { LocaleProvider } from "@/i18n/LocaleProvider";

/**
 * Lenis + GSAP only run in the browser (`ssr: false`). That keeps `gsap` out
 * of the server chunk graph for routes like `/client/*` and avoids missing
 * `vendor-chunks/gsap` errors during RSC / static analysis.
 */
const SmoothScrollRoot = dynamic(
  () => import("@/components/SmoothScrollRoot"),
  { ssr: false, loading: () => null },
);

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return (
    <LocaleProvider>
      <SmoothScrollRoot>
        <Suspense fallback={<div className="antialiased">{children}</div>}>
          <PageTransitionProvider>
            <div className="antialiased">{children}</div>
          </PageTransitionProvider>
        </Suspense>
      </SmoothScrollRoot>
    </LocaleProvider>
  );
}
