"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useResponsiveStore } from "@/experiences/daniel-home-office-portfolio/stores/useResponsiveStore";

const Experience = dynamic(
  () =>
    import("@/experiences/daniel-home-office-portfolio/Experience/Experience"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-black text-sm text-white/50">
        Loading WebGL…
      </div>
    ),
  }
);

export default function DanielPortfolioExperienceClient() {
  const updateDimensions = useResponsiveStore((s) => s.updateDimensions);

  useEffect(() => {
    updateDimensions();
    const onResize = () => updateDimensions();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateDimensions]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <Experience />
    </div>
  );
}
