"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4200;

export default function BrainThoughtsCycle({
  thoughts,
  className,
}: {
  thoughts: ReadonlyArray<string>;
  className?: string;
}) {
  const [idx, setIdx] = React.useState(0);
  const thoughtsKey = thoughts.join("\0");

  React.useEffect(() => {
    setIdx(0);
  }, [thoughtsKey]);

  React.useEffect(() => {
    if (thoughts.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % thoughts.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [thoughts.length, thoughtsKey]);

  if (!thoughts.length) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-3 pt-3 md:px-4 md:pt-4",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[17rem] text-center text-[13px] font-medium leading-snug tracking-tight text-zinc-200 shadow-black/80 drop-shadow-[0_1px_14px_rgba(0,0,0,0.75)] md:max-w-xs md:text-sm"
        >
          {thoughts[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
