"use client";

import { useEffect } from "react";
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
      <div className="antialiased">{children}</div>
    </LocaleProvider>
  );
}
