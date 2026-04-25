"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

import Link from "next/link";

import { useLocale } from "@/i18n/LocaleProvider";

/**
 * How many viewport heights of scroll map to the full vertical scrub (while the stage is pinned).
 * Higher = longer section / slower travel.
 */
const ABOUT_SCRUB_VIEWPORT_HEIGHTS = 2.25;

/** Minimum vertical travel (px) so small viewports still show motion. */
const ABOUT_MIN_RUNWAY_PX = 120;

/** Multiply measured runway so the slide moves this fraction of the previous distance (0.8 = 20% less). */
const ABOUT_TRAVEL_SCALE = 0.8;

/** Extra scroll before scrub starts, and scroll trimmed before scrub ends (px). */
const ABOUT_SCROLL_EDGE_INSET_PX = 40;

/** Viewport ≤ this width: fixed bottom video (90vw) + sequential top copy on scroll (Tailwind `max-[980px]`). */
const ABOUT_MOBILE_LAYOUT_MAX_PX = 980;

/**
 * Additional inset before the About pin engages (viewport px). Delays scrub slightly so the
 * stage has settled; does not move intro copy.
 */
const ABOUT_PIN_START_EXTRA_PX = 56;

const ABOUT_BG_TOP = "#0A0A0A";
const ABOUT_BG_BOTTOM = "#080606";
/** Video edge tints align with the gradient top. */
const ABOUT_BG = ABOUT_BG_TOP;

/**
 * Full About surface: top → bottom with intermediate stops for a smooth read.
 */
const ABOUT_SECTION_BG_GRADIENT = `linear-gradient(
  to bottom,
  ${ABOUT_BG_TOP} 0%,
  #0a0909 18%,
  #090808 38%,
  #080707 58%,
  #080606 78%,
  ${ABOUT_BG_BOTTOM} 100%
)`;

/** Layout width is `w-[80vw]`; scrubbed `scale` starts so the box reads ~this many vw wide. */
const ABOUT_VIDEO_START_VW = 35;
const ABOUT_VIDEO_END_VW = 80;

/** Scrubbed edge fades: % of video width (left strip) and height (top strip). */
const ABOUT_FADE_LEFT_START_PCT = 5;
const ABOUT_FADE_LEFT_END_PCT = 25;
const ABOUT_FADE_TOP_START_PCT = 5;
const ABOUT_FADE_TOP_END_PCT = 10;

/**
 * Three alpha ramps composed with intersect so corners feather once (min alpha), not stacked strips.
 * `--about-fade-left` / `--about-fade-top` are unitless 0–100 scrubbed in the scroll timeline.
 */
const ABOUT_EDGE_MASK_IMAGE = [
  `linear-gradient(to right,
    hsl(0 0% 0% / 0) 0%,
    hsl(0 0% 0% / 0.14) calc(var(--about-fade-left) * 1% * 0.18),
    hsl(0 0% 0% / 0.42) calc(var(--about-fade-left) * 1% * 0.42),
    hsl(0 0% 0% / 0.78) calc(var(--about-fade-left) * 1% * 0.72),
    hsl(0 0% 0% / 1) calc(var(--about-fade-left) * 1%),
    hsl(0 0% 0% / 1) 100%)`,
  `linear-gradient(to bottom,
    hsl(0 0% 0% / 0) 0%,
    hsl(0 0% 0% / 0.12) calc(var(--about-fade-top) * 1% * 0.22),
    hsl(0 0% 0% / 0.4) calc(var(--about-fade-top) * 1% * 0.48),
    hsl(0 0% 0% / 0.78) calc(var(--about-fade-top) * 1% * 0.78),
    hsl(0 0% 0% / 1) calc(var(--about-fade-top) * 1%),
    hsl(0 0% 0% / 1) 100%)`,
  `linear-gradient(to top,
    hsl(0 0% 0% / 0) 0%,
    hsl(0 0% 0% / 0.1) calc(var(--about-fade-top) * 1% * 0.22),
    hsl(0 0% 0% / 0.36) calc(var(--about-fade-top) * 1% * 0.48),
    hsl(0 0% 0% / 0.74) calc(var(--about-fade-top) * 1% * 0.78),
    hsl(0 0% 0% / 1) calc(var(--about-fade-top) * 1%),
    hsl(0 0% 0% / 1) 100%)`,
].join(", ");

const ABOUT_EDGE_MASK_BASE: CSSProperties = {
  maskImage: ABOUT_EDGE_MASK_IMAGE,
  WebkitMaskImage: ABOUT_EDGE_MASK_IMAGE,
  maskSize: "100% 100%",
  maskRepeat: "no-repeat",
  maskMode: "alpha",
  WebkitMaskComposite: "source-in, source-in",
  maskComposite: "intersect, intersect",
};

/** Multi-layer tint so edges pull toward section bg; same feather distance as the mask. */
const ABOUT_EDGE_TINT_BACKGROUND = [
  `linear-gradient(to right, ${ABOUT_BG} 0%, rgba(10, 10, 10, 0.78) calc(var(--about-fade-left) * 1% * 0.28), rgba(10, 10, 10, 0.38) calc(var(--about-fade-left) * 1% * 0.58), rgba(10, 10, 10, 0.12) calc(var(--about-fade-left) * 1% * 0.88), transparent calc(var(--about-fade-left) * 1.05%))`,
  `linear-gradient(to bottom, ${ABOUT_BG} 0%, rgba(10, 10, 10, 0.55) calc(var(--about-fade-top) * 1% * 0.45), rgba(10, 10, 10, 0.18) calc(var(--about-fade-top) * 1% * 0.82), transparent calc(var(--about-fade-top) * 1.08%))`,
  `linear-gradient(to top, ${ABOUT_BG} 0%, rgba(10, 10, 10, 0.48) calc(var(--about-fade-top) * 1% * 0.45), rgba(10, 10, 10, 0.14) calc(var(--about-fade-top) * 1% * 0.82), transparent calc(var(--about-fade-top) * 1.08%))`,
].join(", ");

/**
 * About: Lenis + ScrollTrigger pin; video scrubs vertically, scales (~35vw → 80vw layout), and edge
 * fades grow in sync. Intro copy is absolutely stacked above the reel (z-index) so it can read over the video.
 */
/** Normalized timeline length for the pinned scrub; copy fades use fractional positions (e.g. 0.3 = 30%). */
const ABOUT_SCRUB_TIMELINE_DURATION = 1;

/** Intro copy fades on the pinned scrub timeline (start position 0–1, duration in timeline units). */
const ABOUT_INTRO_TOP_FADE_START = 0;
const ABOUT_INTRO_TOP_FADE_DURATION = 0.5;
const ABOUT_INTRO_SECOND_FADE_START = 0.2;
const ABOUT_INTRO_SECOND_FADE_DURATION = 0.5;
/** Same scrub offset from block 2 as block 2 has from block 1 (`secondStart - topStart`). */
const ABOUT_INTRO_BLOCK_STAGGER = ABOUT_INTRO_SECOND_FADE_START - ABOUT_INTRO_TOP_FADE_START;
const ABOUT_INTRO_THIRD_FADE_START = ABOUT_INTRO_SECOND_FADE_START + ABOUT_INTRO_BLOCK_STAGGER;
const ABOUT_INTRO_THIRD_FADE_DURATION = ABOUT_INTRO_SECOND_FADE_DURATION;

/** Caption blur-in: trigger when caption block’s top crosses this fraction of the viewport height. */
const ABOUT_CAPTION_SCROLL_START_PCT = 79;

export default function About() {
  const { t, locale } = useLocale();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoSlideRef = useRef<HTMLDivElement | null>(null);
  const fadeRootRef = useRef<HTMLDivElement | null>(null);
  const introTopRef = useRef<HTMLDivElement | null>(null);
  const introSecondRef = useRef<HTMLDivElement | null>(null);
  const introThirdRef = useRef<HTMLDivElement | null>(null);
  const lenis = useLenis();

  /**
   * Wait for `lenis` so `SmoothScrollRoot` has installed `ScrollTrigger.scrollerProxy` on
   * `document.documentElement` before we create triggers.
   */
  useLayoutEffect(() => {
    if (!lenis) return undefined;

    const stage = stageRef.current;
    const slide = videoSlideRef.current;
    const fadeRoot = fadeRootRef.current;
    const introTop = introTopRef.current;
    const introSecond = introSecondRef.current;
    const introThird = introThirdRef.current;
    if (!stage || !slide || !fadeRoot || !introTop || !introSecond || !introThird) return undefined;

    const narrowMq = window.matchMedia(
      `(max-width: ${ABOUT_MOBILE_LAYOUT_MAX_PX}px)`,
    );
    const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let ctx: gsap.Context | null = null;

    const scrollEndDistance = () =>
      Math.max(
        0,
        window.innerHeight * ABOUT_SCRUB_VIEWPORT_HEIGHTS - ABOUT_SCROLL_EDGE_INSET_PX,
      );

    const scrollTriggerBase = {
      scroller: document.documentElement,
      trigger: stage,
      start: `top top+=${ABOUT_SCROLL_EDGE_INSET_PX + ABOUT_PIN_START_EXTRA_PX}`,
      end: () => `+=${scrollEndDistance()}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.65,
      invalidateOnRefresh: true,
      markers: false,
    } as const;

    const mount = () => {
      ctx?.revert();
      ctx = null;

      const narrow = narrowMq.matches;
      const reduced = reducedMotionMq.matches;

      if (reduced) {
        gsap.set(slide, { clearProps: "transform", transformOrigin: "right center" });
        fadeRoot.style.setProperty("--about-fade-left", String(ABOUT_FADE_LEFT_END_PCT));
        fadeRoot.style.setProperty("--about-fade-top", String(ABOUT_FADE_TOP_END_PCT));
        fadeRoot.style.setProperty("--about-blur-boost", "1");
        gsap.set([introTop, introSecond, introThird], { clearProps: "opacity,transform" });
        if (narrow) {
          stage.style.setProperty("--about-mobile-vh", "80");
        }
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      if (narrow) {
        gsap.set(slide, { clearProps: "transform", scale: 1, y: 0, transformOrigin: "center bottom" });
        gsap.set(stage, { "--about-mobile-vh": 45 });
        gsap.set(fadeRoot, {
          "--about-fade-left": ABOUT_FADE_LEFT_END_PCT,
          "--about-fade-top": ABOUT_FADE_TOP_END_PCT,
          "--about-blur-boost": 1,
        });
        gsap.set(introTop, { opacity: 0, y: 12 });
        gsap.set(introSecond, { opacity: 0, y: 12 });
        gsap.set(introThird, { opacity: 0, y: 36 });

        ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              ...scrollTriggerBase,
              pinReparent: false,
              pinType: "fixed",
            },
          });

          tl.fromTo(
            stage,
            { "--about-mobile-vh": 45 },
            { "--about-mobile-vh": 80, ease: "none", duration: 1, immediateRender: false },
            0,
          );

          tl.fromTo(
            introTop,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.16, immediateRender: false },
            0,
          );
          tl.to(introTop, { opacity: 0, y: -6, ease: "power2.in", duration: 0.12 }, 0.26);
          tl.fromTo(
            introSecond,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.18, immediateRender: false },
            0.22,
          );
          tl.fromTo(
            introThird,
            { opacity: 0, y: 36 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.22, immediateRender: false },
            0.42,
          );
        }, stage);
        return;
      }

      const runwayPx = () => {
        const st = stageRef.current;
        const sl = videoSlideRef.current;
        if (!st || !sl) return ABOUT_MIN_RUNWAY_PX;
        const raw = st.clientHeight - sl.offsetHeight;
        return Math.max(ABOUT_MIN_RUNWAY_PX, raw);
      };

      const halfTravelPx = () => (runwayPx() / 2) * ABOUT_TRAVEL_SCALE;

      const startScaleRatio = () => {
        const sl = videoSlideRef.current;
        if (!sl || sl.offsetWidth < 1) return ABOUT_VIDEO_START_VW / ABOUT_VIDEO_END_VW;
        const targetW = (ABOUT_VIDEO_START_VW / 100) * window.innerWidth;
        return Math.min(1, targetW / sl.offsetWidth);
      };

      ctx = gsap.context(() => {
        gsap.set(fadeRoot, {
          "--about-fade-left": ABOUT_FADE_LEFT_START_PCT,
          "--about-fade-top": ABOUT_FADE_TOP_START_PCT,
          "--about-blur-boost": 0,
        });
        gsap.set(introTop, { opacity: 0, y: 14 });
        gsap.set(introSecond, { opacity: 0, y: 14 });
        gsap.set(introThird, { opacity: 0, y: 14 });

        const tl = gsap.timeline({
          scrollTrigger: {
            ...scrollTriggerBase,
            pinReparent: true,
            pinType: "transform",
          },
        });

        gsap.set(slide, { transformOrigin: "right center" });

        tl.fromTo(
          slide,
          {
            y: () => -halfTravelPx(),
            scale: () => startScaleRatio(),
          },
          {
            y: () => halfTravelPx(),
            scale: 1,
            ease: "none",
            duration: ABOUT_SCRUB_TIMELINE_DURATION,
            immediateRender: false,
          },
          0,
        );

        tl.fromTo(
          fadeRoot,
          {
            "--about-fade-left": ABOUT_FADE_LEFT_START_PCT,
            "--about-fade-top": ABOUT_FADE_TOP_START_PCT,
            "--about-blur-boost": 0,
          },
          {
            "--about-fade-left": ABOUT_FADE_LEFT_END_PCT,
            "--about-fade-top": ABOUT_FADE_TOP_END_PCT,
            "--about-blur-boost": 1,
            ease: "none",
            duration: ABOUT_SCRUB_TIMELINE_DURATION,
            immediateRender: false,
          },
          0,
        );

        tl.fromTo(
          introTop,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: ABOUT_INTRO_TOP_FADE_DURATION,
            immediateRender: false,
          },
          ABOUT_INTRO_TOP_FADE_START,
        );

        tl.fromTo(
          introSecond,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: ABOUT_INTRO_SECOND_FADE_DURATION,
            immediateRender: false,
          },
          ABOUT_INTRO_SECOND_FADE_START,
        );

        tl.fromTo(
          introThird,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: ABOUT_INTRO_THIRD_FADE_DURATION,
            immediateRender: false,
          },
          ABOUT_INTRO_THIRD_FADE_START,
        );
      }, stage);
    };

    mount();

    const refresh = () => {
      ScrollTrigger.refresh();
    };

    refresh();
    window.addEventListener("resize", refresh, { passive: true });
    const t1 = window.setTimeout(refresh, 80);
    const t2 = window.setTimeout(refresh, 350);
    requestAnimationFrame(refresh);

    const onNarrowChange = () => {
      mount();
      refresh();
      lenis.resize();
    };
    narrowMq.addEventListener("change", onNarrowChange);
    reducedMotionMq.addEventListener("change", onNarrowChange);

    return () => {
      window.removeEventListener("resize", refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      narrowMq.removeEventListener("change", onNarrowChange);
      reducedMotionMq.removeEventListener("change", onNarrowChange);
      ctx?.revert();
      ctx = null;
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        lenis.resize();
      });
    };
  }, [lenis]);

  const captionRootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!lenis) return undefined;

    const root = captionRootRef.current;
    if (!root) return undefined;

    const line1 = root.querySelector<HTMLElement>('[data-caption-line="1"]');
    const line2 = root.querySelector<HTMLElement>('[data-caption-line="2"]');
    const line3 = root.querySelector<HTMLElement>('[data-caption-line="3"]');
    const line4 = root.querySelector<HTMLElement>('[data-caption-line="4"]');
    if (!line1 || !line2 || !line3) return undefined;

    const captionLines = [line1, line2, line3, line4].filter(
      (el): el is HTMLElement => Boolean(el),
    );

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(captionLines, { clearProps: "filter,opacity,transform" });
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);
    const scroller = document.documentElement;

    gsap.set(line1, { opacity: 0, filter: "blur(14px)", y: 12 });
    gsap.set(line2, { opacity: 0, filter: "blur(18px)", y: 14 });
    gsap.set(line3, { opacity: 0, filter: "blur(20px)", y: 15 });
    if (line4) gsap.set(line4, { opacity: 0, filter: "blur(22px)", y: 16 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          scroller,
          trigger: root,
          start: `top ${ABOUT_CAPTION_SCROLL_START_PCT}%`,
          toggleActions: "play none none none",
          once: true,
        },
      });
      tl.to(line1, {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.72,
        ease: "power2.out",
      })
        .to(
          line2,
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.88,
            ease: "power2.out",
          },
          "-=0.38",
        )
        .to(
          line3,
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 1.0,
            ease: "power3.out",
          },
          "-=0.36",
        );
      if (line4) {
        tl.to(
          line4,
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.72,
            ease: "power3.out",
          },
          "-=0.34",
        );
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [lenis, locale]);

  return (
    <section
      id="about"
      className="relative box-border w-full"
      style={{ background: ABOUT_SECTION_BG_GRADIENT }}
      aria-label="About"
    >
      <div
        ref={stageRef}
        className="relative z-10 flex min-h-svh w-full flex-col pb-0 max-[980px]:box-border max-[980px]:[--about-mobile-vh:45] max-[980px]:pb-[min(calc(var(--about-mobile-vh)*1vh+1.25rem),calc(82vh+env(safe-area-inset-bottom,0px)))]"
      >
        {/* Video sits under copy; intro is absolute so it can sit on top as the reel moves. */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-end justify-center pb-0 pt-0 max-[980px]:min-h-0 max-[980px]:flex-none max-[980px]:items-stretch">
          {/* Transform this wrapper so the clip rect moves with the video (no inner crop). */}
          <div
            ref={videoSlideRef}
            className="relative ml-auto mr-6 mt-0 w-[80vw] max-w-none origin-right will-change-transform md:mr-10 lg:mr-12 max-[980px]:fixed max-[980px]:bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-[980px]:left-1/2 max-[980px]:right-auto max-[980px]:top-auto max-[980px]:z-20 max-[980px]:mx-0 max-[980px]:ml-0 max-[980px]:mr-0 max-[980px]:h-[calc(var(--about-mobile-vh)*1vh)] max-[980px]:w-[90vw] max-[980px]:max-w-none max-[980px]:-translate-x-1/2 max-[980px]:will-change-[height,transform]"
          >
            <div
              ref={fadeRootRef}
              className="relative isolate aspect-video w-full overflow-hidden max-[980px]:aspect-auto max-[980px]:h-full max-[980px]:min-h-0 max-[980px]:bg-[#0a0a0a]"
              style={
                {
                  ["--about-fade-left"]: ABOUT_FADE_LEFT_START_PCT,
                  ["--about-fade-top"]: ABOUT_FADE_TOP_START_PCT,
                  ["--about-blur-boost"]: 0,
                } as CSSProperties
              }
            >
              <video
                className="absolute inset-0 z-0 h-full w-full object-cover object-center max-[980px]:object-contain max-[980px]:![mask:none] max-[980px]:![-webkit-mask:none]"
                style={ABOUT_EDGE_MASK_BASE}
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
                src="https://ik.imagekit.io/3bfeucft4/landing_demo.m4v/ik-video.mp4?updatedAt=1776957050492"
              />
              {/* Feathered edges (desktop); hidden on narrow — crisp full-frame video. */}
              <div
                className="pointer-events-none absolute inset-0 z-10 max-[980px]:hidden"
                aria-hidden
              >
                <div
                  className="absolute inset-0"
                  style={{
                    ...ABOUT_EDGE_MASK_BASE,
                    opacity: "calc(0.18 + var(--about-blur-boost, 0) * 0.82)",
                    backdropFilter:
                      "blur(calc(8px + var(--about-blur-boost, 0) * 36px)) saturate(1.08)",
                    WebkitBackdropFilter:
                      "blur(calc(8px + var(--about-blur-boost, 0) * 36px)) saturate(1.08)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    ...ABOUT_EDGE_MASK_BASE,
                    backgroundImage: ABOUT_EDGE_TINT_BACKGROUND,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-stretch">
          <div
            ref={introThirdRef}
            className="absolute bottom-[max(0px,calc(clamp(11rem,32vh,20rem)-10vh))] right-0 z-[31] px-6 motion-reduce:opacity-100 md:px-10 [will-change:opacity,transform] max-[980px]:left-0 max-[980px]:right-0 max-[980px]:top-auto max-[980px]:bottom-[max(calc(6.5rem_+_10dvh),calc(env(safe-area-inset-bottom)_+_5.25rem_+_10dvh))] max-[980px]:pb-2 max-[980px]:px-4 max-[980px]:md:px-4 motion-reduce:max-[980px]:relative motion-reduce:max-[980px]:top-auto motion-reduce:max-[980px]:bottom-auto motion-reduce:max-[980px]:mt-10"
          >
            <div className="pointer-events-auto ml-auto mr-4 flex w-full max-w-xl flex-col items-end text-right md:mr-8 max-[980px]:ml-0 max-[980px]:mr-0 max-[980px]:max-w-none max-[980px]:items-start max-[980px]:text-left">
              <h3
                className="font-syne w-full text-2xl font-semibold leading-snug tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] md:text-[1.65rem]"
                aria-label={t.about.introTitleTertiaryLines.join("")}
              >
                {t.about.introTitleTertiaryLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h3>
              <p
                className="mt-3 w-full max-w-xl text-pretty text-sm leading-relaxed text-white drop-shadow-[0_1px_16px_rgba(0,0,0,0.9)] md:text-base"
                aria-label={t.about.introDescriptionTertiaryLines.join(" ")}
              >
                {t.about.introDescriptionTertiaryLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <div className="mt-5 flex w-full justify-end">
                <Link
                  href="/#book-meeting"
                  className="inline-flex items-center justify-center rounded-full bg-white/90 px-5 py-2.5 text-sm font-medium text-black shadow-md backdrop-blur-sm transition-colors hover:bg-white md:px-6 md:py-3 md:text-base"
                >
                  {t.about.introTertiaryCta}
                </Link>
              </div>
            </div>
          </div>
          <div className="px-6 pt-6 md:px-10 md:pt-10 max-[980px]:px-4 max-[980px]:pt-6 max-[980px]:md:px-4 max-[980px]:md:pt-6">
            <div className="relative ml-4 max-w-xl text-left md:ml-8 max-[980px]:ml-0 max-[980px]:max-w-none max-[980px]:min-h-[min(38vh,260px)] motion-reduce:max-[980px]:min-h-0">
              <div
                ref={introTopRef}
                className="motion-reduce:opacity-100 [will-change:opacity,transform] max-[980px]:absolute max-[980px]:left-0 max-[980px]:right-0 max-[980px]:top-0 motion-reduce:max-[980px]:relative motion-reduce:max-[980px]:top-auto"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-white drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]"
                    aria-hidden
                  />
                  <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]">
                    {t.about.sectionTitle}
                  </span>
                </div>
                <h2 className="font-syne text-3xl font-semibold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.92)] md:text-4xl lg:text-[2.45rem]">
                  {t.about.introTitle}
                </h2>
                <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-zinc-300 drop-shadow-[0_1px_16px_rgba(0,0,0,0.9)] md:text-base">
                  {t.about.introDescription}
                </p>
              </div>
              <div
                ref={introSecondRef}
                className="motion-reduce:opacity-100 [will-change:opacity,transform] max-[980px]:absolute max-[980px]:left-0 max-[980px]:right-0 max-[980px]:top-0 motion-reduce:max-[980px]:relative motion-reduce:max-[980px]:top-auto"
              >
                <h3 className="font-syne mt-10 max-w-lg text-pretty text-2xl font-semibold leading-snug tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] md:mt-12 md:text-[1.65rem] max-[980px]:mt-0">
                  {t.about.introTitleSecondary}
                </h3>
                <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-zinc-300 drop-shadow-[0_1px_16px_rgba(0,0,0,0.9)] md:text-base">
                  {t.about.introDescriptionSecondary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-20 flex w-full shrink-0 justify-center px-0 pb-4 pt-0 md:pb-6">
        <div
          ref={captionRootRef}
          className="w-[40vw] min-w-0 max-w-[96vw] px-2 py-2 text-center md:px-4 md:py-3"
          aria-label="About caption"
        >
          <p
            className="font-hero-bootzy text-[40px] leading-[0.92] text-white/95"
            aria-label={[
              t.about.captionLine.line1,
              t.about.captionLine.line2,
              `${t.about.captionLine.line3Before}${t.about.captionLine.accent}${t.about.captionLine.line3After}`,
              t.about.captionLine.line4,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              data-caption-line="1"
              className="block translate-y-3 opacity-0 blur-[14px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none [will-change:filter,opacity,transform]"
            >
              {t.about.captionLine.line1}
            </span>
            <span
              data-caption-line="2"
              className="mt-1 block translate-y-3 opacity-0 blur-[18px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none [will-change:filter,opacity,transform]"
            >
              {t.about.captionLine.line2}
            </span>
            <span
              data-caption-line="3"
              className="mt-1 block translate-y-4 opacity-0 blur-[20px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none [will-change:filter,opacity,transform]"
            >
              {t.about.captionLine.line3Before}
              <span className="font-hero-new-icon-script relative inline-block text-[2em] leading-[0.88] tracking-tight">
                {t.about.captionLine.accent}
              </span>
              {t.about.captionLine.line3After}
            </span>
            {t.about.captionLine.line4 ? (
              <span
                data-caption-line="4"
                className="mt-1 block translate-y-4 opacity-0 blur-[22px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none [will-change:filter,opacity,transform]"
              >
                {t.about.captionLine.line4}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
