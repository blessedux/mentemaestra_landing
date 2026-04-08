"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MagicText } from "@/components/ui/magic-text";
import { useLocale } from "@/i18n/LocaleProvider";
import { featuredProjects } from "@/data/featured-projects";

const GAP_PX = 24;
const DRAG_COMMIT_PX = 56;

export default function FeaturedWorks() {
  const { t } = useLocale();
  const works = featuredProjects;
  const n = works.length;

  const extended = useMemo(() => {
    if (n === 0) return [];
    return [works[n - 1]!, ...works, works[0]!];
  }, [n, works]);

  /** Logical strip index: 0 = clone of last, 1..n = real slides, n+1 = clone of first */
  const [position, setPosition] = useState(1);
  const positionRef = useRef(position);
  positionRef.current = position;
  const [noTransition, setNoTransition] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragActive = useRef(false);
  const dragStartXRef = useRef(0);
  const suppressLinkClick = useRef(false);

  const slideRef = useRef<HTMLAnchorElement>(null);
  const [slideStep, setSlideStep] = useState(344);
  const [halfCard, setHalfCard] = useState(160);

  useLayoutEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;
    const update = () => {
      const w = slide.offsetWidth;
      setSlideStep(w + GAP_PX);
      setHalfCard(w / 2);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(slide);
    return () => ro.disconnect();
  }, [n, extended.length]);

  const realIndex =
    n === 0 ? 0 : position === 0 ? n - 1 : position === n + 1 ? 0 : position - 1;

  const jumpWithoutAnimation = useCallback((next: number) => {
    setNoTransition(true);
    setPosition(next);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoTransition(false));
    });
  }, []);

  const onTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      const p = positionRef.current;
      if (p === n + 1) jumpWithoutAnimation(1);
      else if (p === 0) jumpWithoutAnimation(n);
    },
    [jumpWithoutAnimation, n],
  );

  const nextSlide = useCallback(() => {
    if (n <= 1) return;
    setNoTransition(false);
    setPosition((p) => (p === n ? n + 1 : Math.min(p + 1, n + 1)));
  }, [n]);

  const prevSlide = useCallback(() => {
    if (n <= 1) return;
    setNoTransition(false);
    setPosition((p) => (p === 1 ? 0 : Math.max(p - 1, 0)));
  }, [n]);

  const endDrag = useCallback(
    (clientX: number, startX: number) => {
      dragActive.current = false;
      const dx = clientX - startX;
      setDragOffset(0);
      setNoTransition(false);

      const moved = Math.abs(dx) > 12;
      if (dx < -DRAG_COMMIT_PX) {
        suppressLinkClick.current = true;
        nextSlide();
      } else if (dx > DRAG_COMMIT_PX) {
        suppressLinkClick.current = true;
        prevSlide();
      } else {
        suppressLinkClick.current = moved;
      }
    },
    [nextSlide, prevSlide],
  );

  const onCarouselPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (n <= 1 || e.button !== 0) return;
    dragActive.current = true;
    suppressLinkClick.current = false;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStartXRef.current = e.clientX;
    setDragOffset(0);
    setNoTransition(true);
  };

  const onCarouselPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragActive.current) return;
    const dx = e.clientX - dragStartXRef.current;
    setDragOffset(dx);
    if (Math.abs(dx) > 12) suppressLinkClick.current = true;
  };

  const onCarouselPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragActive.current) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    endDrag(e.clientX, dragStartXRef.current);
  };

  return (
    <section id="works" className="scroll-mt-28 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              {t.featured.label}
            </span>
          </div>
          <MagicText
            text={t.featured.magic}
            className="flex flex-wrap"
            wordClassName="relative mr-3 mt-3 inline-flex text-3xl font-medium leading-tight md:text-4xl"
            inactiveClassName="absolute inset-0 text-zinc-600"
            activeClassName="relative text-zinc-500"
            highlightedWords={[...t.featured.magicHighlights]}
            highlightedInactiveClassName="absolute inset-0 text-zinc-600"
            highlightedActiveClassName="relative text-white"
          />
        </div>

        {n > 0 && (
          <div
            className="relative cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
            onPointerDown={onCarouselPointerDown}
            onPointerMove={onCarouselPointerMove}
            onPointerUp={onCarouselPointerUp}
            onPointerCancel={onCarouselPointerUp}
          >
            <div
              className={`flex gap-6 ${noTransition ? "" : "transition-transform duration-500 ease-out"}`}
              style={{
                transform: `translateX(calc(${-position * slideStep + dragOffset}px + 50% - ${halfCard}px))`,
              }}
              onTransitionEnd={onTransitionEnd}
            >
              {extended.map((work, index) => (
                <a
                  key={index}
                  ref={index === 1 ? slideRef : undefined}
                  href={work.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(ev) => {
                    if (suppressLinkClick.current) {
                      ev.preventDefault();
                      ev.stopPropagation();
                    }
                  }}
                  onDragStart={(ev) => ev.preventDefault()}
                  className={`w-72 flex-shrink-0 transition-all duration-300 group md:w-80 ${
                    index === position ? "scale-100 opacity-100" : "scale-95 opacity-60"
                  }`}
                >
                  <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-800">
                    <img
                      src={work.image}
                      alt={work.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <h3 className="mb-2 text-2xl font-semibold">{works[realIndex]?.title}</h3>
          <a
            href={works[realIndex]?.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs uppercase tracking-[0.2em] text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
          >
            {works[realIndex]?.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            {works[realIndex]?.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={prevSlide}
            disabled={n <= 1}
            className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">{t.featured.prev}</span>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            disabled={n <= 1}
            className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="text-sm">{t.featured.next}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
