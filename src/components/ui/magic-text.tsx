"use client";

import * as React from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

export interface MagicTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  highlightedWords?: string[];
  highlightedInactiveClassName?: string;
  highlightedActiveClassName?: string;
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
    <span className={wordClassName}>
      <span className={baseClassName}>{children}</span>
      <motion.span style={{ opacity }} className={revealClassName}>
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
    <p ref={container} className={className}>
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
          >
            {word}
          </Word>
        );
      })}
    </p>
  );
};
