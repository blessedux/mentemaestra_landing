"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useResponsiveStore } from "@/experiences/daniel-home-office-portfolio/stores/useResponsiveStore";
import { useLocale } from "@/i18n/LocaleProvider";
import { usePageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";

// Dynamic import governs actual React mounting (canvas creation).
// A separate bare import() call below prefetches the chunk during boot
// so the code is already in the module cache when the IO fires.
const Experience = dynamic(
  () =>
    import(
      "@/experiences/daniel-home-office-portfolio/Experience/Experience"
    ),
  {
    ssr: false,
    // Transparent placeholder — shell bg matches so no visible flash.
    loading: () => <div className="absolute inset-0 bg-[#080708]" aria-hidden />,
  },
);

/** Kick off the JS chunk download without creating a canvas or WebGL context. */
function prefetchExperienceChunk() {
  void import(
    "@/experiences/daniel-home-office-portfolio/Experience/Experience"
  );
}

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

/** Daniel's home-office WebGL room in a bounded box (for the marketing design band). */
const EMBED_BASE_MIN_HEIGHT = "min(525px, 65vh)";
const EMBED_SHELL_BG = "bg-[#080708]";

/** Ease shared with Hero word-reveal. */
const BLUR_EASE = [0.22, 1, 0.36, 1] as const;
/** Title appears first, then each paragraph staggered after. */
const TEXT_TITLE_DURATION = 0.65;
const TEXT_PARA_DURATION = 0.6;
const TEXT_PARA_BASE_DELAY = 0.22;
const TEXT_PARA_STAGGER = 0.12;

export function DanielRoomEmbed({
  className,
  debugOutline,
  extendSceneBottomVh = 0,
}: DanielRoomEmbedProps) {
  const { t } = useLocale();
  const copy = t.danielRoomEmbed.overview;
  const shellRef = useRef<HTMLDivElement>(null);
  const pageTransition = usePageTransition();
  const prefetchedRef = useRef(false);

  /**
   * mountWebGL — controls when the heavy R3F canvas is created.
   * Fires when the section is ~1 viewport below the current scroll position,
   * by which point the hero GLSL shader is already paused (its own IO).
   */
  const [mountWebGL, setMountWebGL] = useState(false);

  /**
   * textVisible — controls the blur/opacity reveal of the left copy block.
   * Fires when the section actually enters the viewport (smaller margin).
   */
  const [textVisible, setTextVisible] = useState(false);

  const updateDimensions = useResponsiveStore((s) => s.updateDimensions);

  // Prefetch the Experience chunk once the page boot cover lifts —
  // no canvas, no WebGL; just downloads and caches the JS module.
  useEffect(() => {
    const bootDone = pageTransition?.initialBootPhase === "done";
    if (!bootDone || prefetchedRef.current) return;
    prefetchedRef.current = true;
    // Defer by one idle frame so we don't compete with the boot reveal animation.
    const id = window.setTimeout(prefetchExperienceChunk, 600);
    return () => window.clearTimeout(id);
  }, [pageTransition?.initialBootPhase]);

  // Two separate IntersectionObservers on the same shell element:
  //  • mountIO  — large rootMargin fires ~1 viewport before section enters view
  //               (canvas mounts while user is still in About, hero GLSL already paused)
  //  • textIO   — small negative margin fires only when section is visibly entering
  useEffect(() => {
    const root = shellRef.current;
    if (!root) return undefined;

    const mountIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMountWebGL(true);
      },
      // "0px 0px 100% 0px" — trigger when element is within 1 viewport below
      { root: null, rootMargin: "0px 0px 100% 0px", threshold: 0 },
    );

    const textIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTextVisible(true);
      },
      // Small positive margin — fire just as section scrolls into view
      { root: null, rootMargin: "0px 0px -5% 0px", threshold: 0.08 },
    );

    mountIO.observe(root);
    textIO.observe(root);
    return () => {
      mountIO.disconnect();
      textIO.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    updateDimensions();
  }, [updateDimensions]);

  // Debounced resize so rapid orientation changes don't thrash the store.
  useEffect(() => {
    updateDimensions();
    let debounceTimer = 0;
    const onResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        debounceTimer = 0;
        updateDimensions();
      }, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
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
      ref={shellRef}
      style={shellStyle}
      className={cn(
        "relative isolate h-full w-full overflow-visible",
        EMBED_SHELL_BG,
        !extendBottom && "min-h-[min(525px,65vh)]",
        "max-[980px]:flex max-[980px]:min-h-[100dvh] max-[980px]:min-h-[100svh] max-[980px]:flex-col max-[980px]:overflow-x-hidden max-[980px]:overflow-y-visible",
        debugOutline && "outline outline-2 outline-offset-2 outline-orange-400",
        className,
      )}
    >
      {/* Scene: fills shell on desktop; top band on mobile (split with copy below). */}
      <div className="absolute inset-0 max-[980px]:static max-[980px]:order-1 max-[980px]:h-[min(56dvh,520px)] max-[980px]:min-h-[280px] max-[980px]:shrink-0 max-[980px]:grow-0 max-[980px]:overflow-visible">
        {mountWebGL ? (
          <Experience embedded />
        ) : (
          <div className="absolute inset-0 bg-[#080708] max-[980px]:static max-[980px]:h-full" aria-hidden />
        )}
      </div>

      {/* Left copy — blur + opacity reveal once section enters view */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 ml-6 flex max-w-[min(100%,22.8rem)] -translate-y-[10vh] flex-col justify-center px-5 py-8 pr-2 text-white sm:ml-10 md:ml-14 md:max-w-[min(100%,28.8rem)] md:px-8 md:py-10 lg:ml-20 max-[980px]:pointer-events-auto max-[980px]:relative max-[980px]:inset-auto max-[980px]:order-2 max-[980px]:mt-0 max-[980px]:flex max-[980px]:min-h-0 max-[980px]:w-full max-[980px]:max-w-none max-[980px]:shrink-0 max-[980px]:translate-y-0 max-[980px]:flex-col max-[980px]:justify-start max-[980px]:bg-transparent max-[980px]:px-5 max-[980px]:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-[980px]:pt-4 max-[980px]:sm:ml-0 max-[980px]:md:ml-0 max-[980px]:md:max-w-none max-[980px]:lg:ml-0"
        aria-live="polite"
      >
        <motion.h3
          initial={{ opacity: 0, filter: "blur(14px)", y: 10 }}
          animate={
            textVisible
              ? { opacity: 1, filter: "blur(0px)", y: 0 }
              : { opacity: 0, filter: "blur(14px)", y: 10 }
          }
          transition={{ duration: TEXT_TITLE_DURATION, ease: BLUR_EASE }}
          className="w-full min-w-0 max-w-full text-pretty text-[2.25rem] font-medium leading-tight tracking-tight text-white max-[980px]:!text-[clamp(1.35rem,4.8vw,2.25rem)] md:text-[2.5rem]"
        >
          {copy.title}
        </motion.h3>
        <div className="mt-3 flex flex-col gap-2.5 text-sm text-white/90 md:mt-4 md:gap-3 md:text-base">
          {copy.bodyParagraphs.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, filter: "blur(10px)", y: 7 }}
              animate={
                textVisible
                  ? { opacity: 1, filter: "blur(0px)", y: 0 }
                  : { opacity: 0, filter: "blur(10px)", y: 7 }
              }
              transition={{
                duration: TEXT_PARA_DURATION,
                ease: BLUR_EASE,
                delay: TEXT_PARA_BASE_DELAY + i * TEXT_PARA_STAGGER,
              }}
              className="text-pretty leading-[1.75] md:leading-[1.85]"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}
