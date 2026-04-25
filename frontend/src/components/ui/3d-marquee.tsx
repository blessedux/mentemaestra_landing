"use client";

/**
 * @author: @emerald-ui
 * @description: A 3D marquee component that rotates images in a 3D space.
 * @version: 1.0.0
 * @date: 2026-02-12
 * @license: MIT
 * @website: https://emerald-ui.com
 */
import { cn } from "@/lib/utils";

export type ThreeDMarqueeCard = {
  image: string;
  title: string;
  href: string;
  /** Stable key when the same image/title is repeated for density */
  id?: string;
};

export interface ThreeDMarqueeProps {
  /** Preferred: one object per card so image and URL always match */
  cards?: ThreeDMarqueeCard[];
  images?: string[];
  imageAlts?: string[];
  imageLinks?: string[];
  className?: string;
}

const MARQUEE_DURATION_S = [40, 44, 42] as const;

const defaultImages = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504639725590-34d0984418bd?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&auto=format&fit=crop",
];

function normalizeCards(
  cards: ThreeDMarqueeCard[] | undefined,
  images: string[],
  imageAlts: string[] | undefined,
  imageLinks: string[] | undefined,
): ThreeDMarqueeCard[] {
  if (cards?.length) return cards;
  return images.map((image, i) => ({
    image,
    title: imageAlts?.[i] ?? "",
    href: (imageLinks?.[i] ?? "").trim(),
  }));
}

function ThreeDMarquee({
  cards: cardsProp,
  images = defaultImages,
  imageAlts,
  imageLinks,
  className,
}: ThreeDMarqueeProps) {
  const cardList = normalizeCards(cardsProp, images, imageAlts, imageLinks);
  const chunkSize = Math.ceil(cardList.length / 3);
  const chunks = Array.from({ length: 3 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return cardList.slice(start, start + chunkSize);
  });

  function renderColumnItems(
    subarray: ThreeDMarqueeCard[],
    colIndex: number,
    duplicateKey: "a" | "b",
  ) {
    return subarray.map((card, imageIndex) => {
      const href = card.href.trim();
      const img = (
        <img
          className="pointer-events-none aspect-[2/3] h-full w-full rounded-lg bg-neutral-100 object-cover select-none dark:bg-neutral-900"
          src={card.image}
          draggable={false}
          alt={card.title}
        />
      );
      const itemWrap = cn(
        "relative z-10 block w-full overflow-hidden rounded-lg outline-none transition-opacity duration-200 hover:opacity-95",
        href &&
          "cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      );

      return (
        <div
          className="relative w-full shrink-0 [transform:translateZ(0.1px)]"
          key={`${colIndex}-${duplicateKey}-${imageIndex}-${card.id ?? `${card.image}-${card.title}`}`}
        >
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(itemWrap, "pointer-events-auto")}
            >
              {img}
            </a>
          ) : (
            <div className={itemWrap}>{img}</div>
          )}
        </div>
      );
    });
  }

  return (
    <div
      className={cn(
        "block h-140 w-full max-w-none overflow-visible max-xl:h-120 max-sm:h-100",
        className,
      )}
    >
      <div className="flex size-full min-h-0 items-center justify-center px-0 max-sm:justify-end">
        <div className="aspect-square size-full min-h-0 w-full max-w-none shrink-0 scale-[1.28] max-xl:scale-110 max-sm:scale-[1.22] max-sm:translate-x-[10%] max-sm:origin-[80%_50%]">
          <div
            style={{ transform: "rotateX(45deg) rotateY(0deg) rotateZ(45deg)" }}
            className="relative top-0 right-[-50%] grid size-full min-h-0 origin-top-left grid-cols-3 gap-4 [transform-style:preserve-3d] max-xl:-top-28 max-xl:right-[-42%] max-xl:gap-4 max-sm:top-0 max-sm:right-[-22%] max-sm:gap-2.5"
          >
            {chunks.map((subarray, colIndex) => {
              const duration = MARQUEE_DURATION_S[colIndex % MARQUEE_DURATION_S.length];
              const downward = colIndex % 2 === 0;
              return (
                <div
                  key={`${colIndex}-marquee`}
                  className="three-d-marquee-column relative h-full min-h-0 w-full overflow-hidden"
                >
                  <div
                    className="three-d-marquee-track flex w-full flex-col items-start gap-12 max-sm:gap-6"
                    style={{
                      animation: `${downward ? "marquee-3d-y-down" : "marquee-3d-y-up"} ${duration}s linear infinite`,
                      willChange: "transform",
                    }}
                  >
                    {renderColumnItems(subarray, colIndex, "a")}
                    {renderColumnItems(subarray, colIndex, "b")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreeDMarquee;
