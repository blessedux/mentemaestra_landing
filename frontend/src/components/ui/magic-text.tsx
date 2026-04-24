"use client";

import * as React from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";

export interface MagicTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  highlightedWords?: string[];
  highlightedInactiveClassName?: string;
  highlightedActiveClassName?: string;
  /** When true, outlines each word shell and the root `<p>` for layout debugging. */
  debugOutline?: boolean;
}

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  wordClassName?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  isHighlighted?: boolean;
  highlightedInactiveClassName?: string;
  highlightedActiveClassName?: string;
  debugOutline?: boolean;
}

const Word: React.FC<WordProps> = ({
  children,
  progress,
  range,
  wordClassName,
  inactiveClassName,
  activeClassName,
  isHighlighted,
  highlightedInactiveClassName,
  highlightedActiveClassName,
  debugOutline,
}) => {
  const opacity = useTransform(progress, range, [0, 1]);
  const baseClassName =
    isHighlighted && highlightedInactiveClassName
      ? highlightedInactiveClassName
      : inactiveClassName;
  const revealClassName =
    isHighlighted && highlightedActiveClassName
      ? highlightedActiveClassName
      : activeClassName;

  return (
    <span
      className={cn(
        wordClassName,
        "relative bg-transparent",
        debugOutline &&
          "z-[2] ring-2 ring-pink-500 ring-offset-2 ring-offset-transparent",
      )}
    >
      <span
        className={cn(
          baseClassName,
          /* Do not add `relative` here: callers use `absolute inset-0` for this layer;
           * tailwind-merge would drop `absolute` in favor of `relative` and both word copies stack in flow. */
          "z-0",
          debugOutline && "ring-1 ring-zinc-500/50",
        )}
      >
        {children}
      </span>
      <motion.span
        style={{ opacity }}
        className={cn(
          revealClassName,
          "relative z-[1]",
          debugOutline && "ring-1 ring-emerald-400/40",
        )}
      >
        {children}
      </motion.span>
    </span>
  );
};

export const MagicText: React.FC<MagicTextProps> = ({
  text,
  className,
  wordClassName = "relative mr-3 mt-3 inline-flex text-3xl font-medium leading-none md:text-4xl lg:text-5xl",
  inactiveClassName = "absolute inset-0 text-zinc-500",
  activeClassName = "relative text-white",
  highlightedWords = [],
  highlightedInactiveClassName,
  highlightedActiveClassName,
  debugOutline,
}) => {
  const container = React.useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.9", "start 0.25"],
  });

  const words = text.split(" ");
  const normalizedHighlightedWords = new Set(
    highlightedWords.map((word) => word.toLowerCase()),
  );

  return (
    <p
      ref={container}
      className={cn(
        className,
        debugOutline && "outline outline-2 outline-offset-2 outline-violet-400/80",
      )}
    >
      {words.map((word, index) => {
        const start = index / words.length;
        const end = start + 1 / words.length;
        const normalizedWord = word
          .toLowerCase()
          .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
        const isHighlighted = normalizedHighlightedWords.has(normalizedWord);

        return (
          <Word
            key={`${word}-${start}`}
            progress={scrollYProgress}
            range={[start, end]}
            wordClassName={wordClassName}
            inactiveClassName={inactiveClassName}
            activeClassName={activeClassName}
            isHighlighted={isHighlighted}
            highlightedInactiveClassName={highlightedInactiveClassName}
            highlightedActiveClassName={highlightedActiveClassName}
            debugOutline={debugOutline}
          >
            {word}
          </Word>
        );
      })}
    </p>
  );
};
