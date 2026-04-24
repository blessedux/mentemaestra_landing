"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import { cn } from "@/lib/utils";

export type LayeredTextLine = { top: string; bottom: string };

export const MENTE_MAESTRA_DESIGN_STUDIO_LINES: LayeredTextLine[] = [
  { top: "\u00A0", bottom: "MENTE" },
  { top: "MENTE", bottom: "MAESTRA" },
  { top: "MAESTRA", bottom: "DESIGN" },
  { top: "DESIGN", bottom: "STUDIO" },
  { top: "STUDIO", bottom: "\u00A0" },
];

export interface LayeredTextProps {
  lines?: LayeredTextLine[];
  fontSize?: string;
  fontSizeMd?: string;
  lineHeight?: number;
  lineHeightMd?: number;
  /** `start` = left column (e.g. About band); `center` = default isometric fan */
  contentAlign?: "center" | "start";
  /**
   * `full` = hover anywhere on the block. `leading` = only the left strip (avoids
   * full-width rows firing when the cursor is in empty space or over the right copy).
   */
  hoverTrigger?: "full" | "leading";
  className?: string;
  /** Outlines root, hover strip, list, each line and text row for layout debugging. */
  debugOutline?: boolean;
}

export function LayeredText({
  lines = MENTE_MAESTRA_DESIGN_STUDIO_LINES,
  fontSize = "72px",
  fontSizeMd = "36px",
  lineHeight = 60,
  lineHeightMd = 35,
  contentAlign = "center",
  hoverTrigger = "full",
  className,
  debugOutline,
}: LayeredTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverStripRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | undefined>(undefined);

  const calculateTranslateX = (index: number) => {
    const baseOffset = 35;
    const baseOffsetMd = 20;
    const centerIndex = Math.floor(lines.length / 2);
    return {
      desktop: (index - centerIndex) * baseOffset,
      mobile: (index - centerIndex) * baseOffsetMd,
    };
  };

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const container = containerRef.current;
    const paragraphs = container.querySelectorAll("p");
    const hoverTarget =
      hoverTrigger === "leading" ? hoverStripRef.current : container;

    if (!hoverTarget) return undefined;

    timelineRef.current = gsap.timeline({ paused: true });

    timelineRef.current.to(paragraphs, {
      y: window.innerWidth >= 768 ? -60 : -35,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.08,
    });

    const handleMouseEnter = () => {
      timelineRef.current?.play();
    };

    const handleMouseLeave = () => {
      timelineRef.current?.reverse();
    };

    hoverTarget.addEventListener("mouseenter", handleMouseEnter);
    hoverTarget.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      hoverTarget.removeEventListener("mouseenter", handleMouseEnter);
      hoverTarget.removeEventListener("mouseleave", handleMouseLeave);
      timelineRef.current?.kill();
      timelineRef.current = undefined;
    };
  }, [lines, hoverTrigger]);

  const containerStyle = {
    fontSize,
    "--md-font-size": fontSizeMd,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative py-24 font-sans font-black uppercase tracking-[-2px] text-white antialiased",
        hoverTrigger === "full" && "cursor-pointer",
        contentAlign === "start"
          ? "mx-0 mr-auto w-full max-w-none"
          : "mx-auto",
        debugOutline &&
          "outline outline-2 outline-offset-2 outline-orange-400/90",
        className,
      )}
      style={containerStyle}
    >
      {hoverTrigger === "leading" ? (
        <div
          ref={hoverStripRef}
          className={cn(
            "pointer-events-auto absolute left-0 top-0 z-10 h-full w-24 cursor-pointer md:w-32",
            debugOutline &&
              "outline outline-1 outline-dashed outline-yellow-300/80",
          )}
          aria-hidden
        />
      ) : null}
      <ul
        className={cn(
          "relative z-0 m-0 flex list-none flex-col p-0",
          contentAlign === "start" ? "items-start" : "items-center",
          debugOutline &&
            "outline outline-1 outline-offset-1 outline-cyan-400/70",
        )}
      >
        {lines.map((line, index) => {
          const translateX = calculateTranslateX(index);
          const skewEven = index % 2 === 0;
          const skew = skewEven ? "60deg, -30deg" : "0deg, -30deg";
          const scaleY = skewEven ? "0.66667" : "1.33333";

          const liStyle = {
            height: `${lineHeight}px`,
            transform: `translateX(${translateX.desktop}px) skew(${skew}) scaleY(${scaleY})`,
            "--md-height": `${lineHeightMd}px`,
            "--md-translateX": `${translateX.mobile}px`,
          } as CSSProperties;

          const pStyle = {
            height: `${lineHeight}px`,
            lineHeight: `${lineHeight - 5}px`,
          } as CSSProperties;

          return (
            <li
              key={`${line.top}-${line.bottom}-${index}`}
              className={cn(
                "relative overflow-hidden",
                debugOutline &&
                  "outline outline-1 outline-fuchsia-400/60",
              )}
              style={liStyle}
            >
              <p
                className={cn(
                  "m-0 whitespace-nowrap px-[15px] align-top leading-[55px] md:leading-[30px]",
                  debugOutline &&
                    "outline outline-1 outline-dotted outline-lime-400/50",
                )}
                style={pStyle}
              >
                {line.top}
              </p>
              <p
                className={cn(
                  "m-0 whitespace-nowrap px-[15px] align-top leading-[55px] md:leading-[30px]",
                  debugOutline &&
                    "outline outline-1 outline-dotted outline-teal-400/50",
                )}
                style={pStyle}
              >
                {line.bottom}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
