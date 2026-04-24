"use client";

import dynamic from "next/dynamic";
import { useEffect, type CSSProperties } from "react";

import { useResponsiveStore } from "@/experiences/daniel-home-office-portfolio/stores/useResponsiveStore";
import { useLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const Experience = dynamic(
  () =>
    import(
      "@/experiences/daniel-home-office-portfolio/Experience/Experience"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-[#080708] text-sm text-white/60">
        Loading room…
      </div>
    ),
  },
);

export type DanielRoomEmbedProps = {
  className?: string;
  /** When About layout debug outlines are on, ring this shell too. */
  debugOutline?: boolean;
  /**
   * Adds this many vh to the shell min-height so the WebGL canvas extends downward
   * (same clear color / room framing) instead of a flat HTML band.
   */
  extendSceneBottomVh?: number;
};

/**
 * Daniel’s home-office WebGL room in a bounded box (for the marketing Welcome / design band).
 */
const EMBED_BASE_MIN_HEIGHT = "min(525px, 65vh)";
const EMBED_SHELL_BG = "bg-[#080708]";

export function DanielRoomEmbed({
  className,
  debugOutline,
  extendSceneBottomVh = 0,
}: DanielRoomEmbedProps) {
  const { t } = useLocale();
  const copy = t.danielRoomEmbed.overview;

  const updateDimensions = useResponsiveStore((s) => s.updateDimensions);

  useEffect(() => {
    updateDimensions();
    const onResize = () => updateDimensions();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateDimensions]);

  const extendBottom =
    typeof extendSceneBottomVh === "number" && extendSceneBottomVh > 0;

  const shellStyle: CSSProperties | undefined = extendBottom
    ? {
        minHeight: `calc(${EMBED_BASE_MIN_HEIGHT} + ${extendSceneBottomVh}vh)`,
      }
    : undefined;

  return (
    <div
      style={shellStyle}
      className={cn(
        "relative isolate h-full w-full overflow-visible",
        EMBED_SHELL_BG,
        !extendBottom && "min-h-[min(525px,65vh)]",
        debugOutline && "outline outline-2 outline-offset-2 outline-orange-400",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 ml-6 flex max-w-[min(100%,22.8rem)] -translate-y-[10vh] flex-col justify-center px-5 py-8 pr-2 text-white sm:ml-10 md:ml-14 md:max-w-[min(100%,28.8rem)] md:px-8 md:py-10 lg:ml-20"
        aria-live="polite"
      >
        <h3 className="text-[2.25rem] font-medium leading-tight tracking-tight text-white md:text-[2.5rem]">
          {copy.title}
        </h3>
        <div className="mt-3 flex flex-col gap-2.5 text-sm text-white/90 md:mt-4 md:gap-3 md:text-base">
          {copy.bodyParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-pretty leading-[1.75] md:leading-[1.85]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      <Experience embedded />
    </div>
  );
}
