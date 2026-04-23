"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BASE = "/imgs/stack_images";

/** Local stack logos — filenames match `public/imgs/stack_images`. */
const STACK_ITEMS = [
  { name: "Next.js", src: `${BASE}/next_logo_black.png` },
  { name: "Vercel", src: `${BASE}/vercel_logo_black.png` },
  { name: "Three.js", src: `${BASE}/threejs_logo_black.png` },
  { name: "Tailwind CSS", src: `${BASE}/tailwind_logo_black.png` },
  { name: "Sanity", src: `${BASE}/Sanity_logo_black.png` },
  { name: "Webpay", src: `${BASE}/webpay_logo_black.png` },
] as const;

/** Uniform frame: source assets share the same dimensions; `object-contain` keeps logos centered. */
const ICON_FRAME_CLASS =
  "relative aspect-square h-20 w-20 shrink-0 md:h-24 md:w-24";

/** Positions 1+3, then 2+4 — overlapping pairs so the grid never fully empties. */
const EXIT_GROUPS = [
  [0, 2],
  [1, 3],
] as const;

/**
 * Each slot walks its own permutation of icon indices so choreography stays varied
 * and we can pick a next icon that is never already on another slot.
 */
const SLOT_CYCLES: ReadonlyArray<readonly number[]> = [
  [0, 1, 2, 3, 4, 5],
  [1, 3, 5, 0, 2, 4],
  [2, 5, 1, 4, 0, 3],
  [3, 4, 0, 5, 2, 1],
];

type SlotPhase = "idle" | "out" | "in";

const BLUR_LEG_MS = 600;
const HOLD_MS = 2500;

const idlePhases = (): SlotPhase[] => ["idle", "idle", "idle", "idle"];

function pickNextIcon(slot: number, current: number[], n: number): number {
  const forbidden = new Set<number>();
  for (let i = 0; i < 4; i++) {
    if (i !== slot) forbidden.add(current[i]);
  }

  const cycle = SLOT_CYCLES[slot];
  const cur = current[slot];
  const startPos = cycle.indexOf(cur);
  const base = startPos >= 0 ? startPos : 0;

  for (let step = 1; step <= n; step++) {
    const cand = cycle[(base + step) % cycle.length];
    if (!forbidden.has(cand)) return cand;
  }

  for (let v = 0; v < n; v++) {
    if (!forbidden.has(v)) return v;
  }

  return cur;
}

export default function Stack() {
  const n = STACK_ITEMS.length;
  const [indices, setIndices] = useState<number[]>([0, 1, 2, 3]);
  const [phases, setPhases] = useState<SlotPhase[]>(idlePhases);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    const run = async () => {
      while (!cancelled) {
        await wait(HOLD_MS);
        if (cancelled) break;

        for (const group of EXIT_GROUPS) {
          if (cancelled) break;

          for (const slot of group) {
            if (cancelled) break;
            setPhases((p) => {
              const next = [...p];
              next[slot] = "out";
              return next;
            });
            await wait(BLUR_LEG_MS);
          }
          if (cancelled) break;

          setIndices((prev) => {
            const work = [...prev];
            for (const slot of group) {
              work[slot] = pickNextIcon(slot, work, n);
            }
            return work;
          });

          setPhases((p) => {
            const next = [...p];
            for (const slot of group) next[slot] = "in";
            return next;
          });
          await wait(BLUR_LEG_MS);
          if (cancelled) break;

          setPhases((p) => {
            const next = [...p];
            for (const slot of group) next[slot] = "idle";
            return next;
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [n]);

  return (
    <section className="bg-black px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 place-items-center gap-x-16 gap-y-12 md:grid-cols-4 md:gap-x-20 md:gap-y-16">
          {[0, 1, 2, 3].map((slot) => {
            const idx = indices[slot]!;
            const item = STACK_ITEMS[idx];
            const phase = phases[slot];
            const phaseClass =
              phase === "out"
                ? "opacity-0 blur-[14px]"
                : "opacity-100 blur-0";

            return (
              <div
                key={slot}
                className={`${ICON_FRAME_CLASS} transition-[opacity,filter] duration-600 ease-in-out ${phaseClass}`}
              >
                <Image
                  key={`${slot}-${idx}`}
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 80px, 96px"
                  className="object-contain"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
