"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
} as const;

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES;
  blurLayers?: number;
  className?: string;
  blurIntensity?: number;
  isVisible?: boolean;
} & HTMLMotionProps<"div">;

export function ProgressiveBlur({
  direction = "bottom",
  blurLayers = 8,
  className,
  blurIntensity = 0.25,
  isVisible = true,
  ...props
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2);
  const segmentSize = 1 / (blurLayers + 1);

  return (
    <>
      {Array.from({ length: layers }).map((_, index) => {
        const angle = GRADIENT_ANGLES[direction];
        const startPos = index * segmentSize;
        const endPos = (index + 1) * segmentSize;
        const blurStart = Math.max(0, startPos - 0.1);
        const blurEnd = Math.min(1, endPos + 0.1);
        const gradientStops = [
          `${blurStart * 100}%`,
          `${startPos * 100}%`,
          `${endPos * 100}%`,
          `${blurEnd * 100}%`,
        ].map(
          (pos, posIndex) =>
            `rgba(255, 255, 255, ${posIndex === 1 || posIndex === 2 ? 1 : 0}) ${pos}`
        );
        const gradient = `linear-gradient(${angle}deg, ${gradientStops.join(", ")})`;

        return (
          <motion.div
            key={index}
            className={cn("pointer-events-none absolute inset-0", className)}
            style={{
              maskImage: gradient,
              WebkitMaskImage: gradient,
              backdropFilter: `blur(${blurIntensity * (index + 1)}px)`,
            }}
            {...props}
          />
        );
      })}
    </>
  );
}
