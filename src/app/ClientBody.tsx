"use client";

import { Suspense, useEffect } from "react";
import SmoothScrollRoot from "@/components/SmoothScrollRoot";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { PageTransitionProvider } from "@/components/PageTransition";

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
