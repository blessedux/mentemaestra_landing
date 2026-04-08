"use client";

import { useEffect } from "react";
import SmoothScrollRoot from "@/components/SmoothScrollRoot";
import { LocaleProvider } from "@/i18n/LocaleProvider";

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
        <div className="antialiased">{children}</div>
      </SmoothScrollRoot>
    </LocaleProvider>
  );
}
