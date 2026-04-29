"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Phase = "idle" | "out" | "loader" | "in";

/** First paint: same overlay as route transitions until fonts + window load, then blur-in. */
export type InitialBootPhase = "cover" | "reveal" | "done";

/** `default` — dim + logo overlay. `slide` — full-screen panel slides up, then exits upward. */
export type PageTransitionVariant = "default" | "slide";

const PAGE_TRANSITION_VARIANT: PageTransitionVariant =
  process.env.NEXT_PUBLIC_PAGE_TRANSITION_VARIANT === "slide"
    ? "slide"
    : "default";

const easeMsDefault = {
  out: 360,
  loaderMin: 300,
  in: 420,
};

const easeMsSlide = {
  out: 420,
  loaderMin: 300,
  in: 480,
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function timing(reduced: boolean, variant: PageTransitionVariant) {
  if (reduced) {
    return { out: 80, loaderMin: 0, in: 80 };
  }
  return variant === "slide" ? easeMsSlide : easeMsDefault;
}

function pathWithSearch(pathname: string, searchParams: URLSearchParams) {
  const q = searchParams.toString();
  return q ? `${pathname}?${q}` : pathname;
}

type PageTransitionContextValue = {
  navigate: (href: string) => void;
  /** Which preloader UI is active (from `NEXT_PUBLIC_PAGE_TRANSITION_VARIANT`). */
  variant: PageTransitionVariant;
  /** Initial load: `cover` → `reveal` (content sharpens) → `done`. Hero copy can sequence after `done`. */
  initialBootPhase: InitialBootPhase;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(
  null,
);

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [initialBootPhase, setInitialBootPhase] =
    useState<InitialBootPhase>("cover");
  const [slideCoverReady, setSlideCoverReady] = useState(false);
  const pendingPathRef = useRef<string | null>(null);
  const startPathRef = useRef<string | null>(null);
  const inflightRef = useRef(false);
  const completingRef = useRef(false);

  const variant = PAGE_TRANSITION_VARIANT;

  const completeTransition = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    const t = timing(reducedMotion, variant);
    setPhase("in");
    await new Promise((r) => setTimeout(r, t.in));
    setPhase("idle");
    pendingPathRef.current = null;
    startPathRef.current = null;
    inflightRef.current = false;
    completingRef.current = false;
  }, [reducedMotion, variant]);

  const currentKey = pathWithSearch(pathname, searchParams);

  useEffect(() => {
    if (initialBootPhase !== "cover") return;
    let cancelled = false;
    void (async () => {
      try {
        await Promise.race([
          Promise.all([
            document.fonts?.ready ?? Promise.resolve(),
            new Promise<void>((resolve) => {
              if (document.readyState === "complete") resolve();
              else
                window.addEventListener("load", () => resolve(), {
                  once: true,
                });
            }),
          ]),
          new Promise<void>((r) => setTimeout(r, 6000)),
        ]);
      } finally {
        if (cancelled) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) setInitialBootPhase("reveal");
          });
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialBootPhase]);

  useEffect(() => {
    if (initialBootPhase !== "reveal") return;
    const ms = timing(reducedMotion, variant).in;
    const id = window.setTimeout(() => setInitialBootPhase("done"), ms);
    return () => clearTimeout(id);
  }, [initialBootPhase, reducedMotion, variant]);

  useEffect(() => {
    if (variant !== "slide") return;
    if (phase === "out") {
      setSlideCoverReady(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideCoverReady(true));
      });
      return () => cancelAnimationFrame(id);
    }
    const bootSlide =
      initialBootPhase === "cover" || initialBootPhase === "reveal";
    setSlideCoverReady(phase !== "idle" || bootSlide);
  }, [phase, variant, initialBootPhase]);

  useEffect(() => {
    if (phase !== "loader" || !pendingPathRef.current) return;
    // Complete the transition once navigation has settled on ANY new route.
    // This must handle server redirects (e.g. /client/* pages redirecting to /login),
    // where `currentKey` will never equal the originally requested destination.
    if (!startPathRef.current) return;
    if (currentKey === startPathRef.current) return;
    let cancelled = false;
    const t = timing(reducedMotion, variant);
    const id = requestAnimationFrame(() => {
      setTimeout(() => {
        if (!cancelled) void completeTransition();
      }, Math.max(t.loaderMin, 32));
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [currentKey, phase, completeTransition, reducedMotion, variant]);

  /** If RSC never completes (hung fetch), pathname may not update — avoid infinite loader. */
  useEffect(() => {
    if (phase !== "loader" || !pendingPathRef.current) return;
    const id = window.setTimeout(() => {
      void completeTransition();
    }, 30_000);
    return () => clearTimeout(id);
  }, [phase, completeTransition]);

  const isHashOnlyOnSamePage = useCallback((url: URL) => {
    const cur = new URL(window.location.href);
    return url.pathname === cur.pathname && url.search === cur.search;
  }, []);

  const navigate = useCallback(
    async (href: string) => {
      if (initialBootPhase !== "done") return;
      if (inflightRef.current) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (isHashOnlyOnSamePage(url)) return;

      const destKey = `${url.pathname}${url.search}`;
      const liveKey = `${window.location.pathname}${window.location.search}`;
      if (destKey === liveKey && !url.hash) return;

      inflightRef.current = true;
      completingRef.current = false;
      pendingPathRef.current = destKey;
      startPathRef.current = liveKey;
      const t = timing(reducedMotion, variant);

      setPhase("out");
      await new Promise((r) => setTimeout(r, t.out));
      setPhase("loader");

      const dest = `${url.pathname}${url.search}${url.hash}`;
      router.push(dest);
    },
    [router, reducedMotion, variant, isHashOnlyOnSamePage, initialBootPhase],
  );

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (initialBootPhase !== "done") return;
      if (phase !== "idle") return;
      const el = (e.target as Element | null)?.closest("a[href]");
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (a.target && a.target !== "" && a.target !== "_self") return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:"))
        return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (isHashOnlyOnSamePage(url)) return;
      // Portal: same-origin /client/… → /client/… should use default Next navigation.
      // Custom transition + slow RSC (e.g. GSC) can leave the URL unchanged and trap the loader.
      if (
        window.location.pathname.startsWith("/client/") &&
        url.pathname.startsWith("/client/")
      ) {
        return;
      }
      const destKey = `${url.pathname}${url.search}`;
      const liveKey = `${window.location.pathname}${window.location.search}`;
      if (destKey === liveKey && !url.hash) return;
      e.preventDefault();
      void navigate(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [phase, navigate, isHashOnlyOnSamePage, initialBootPhase]);

  const ctx = useMemo(
    () => ({ navigate, variant, initialBootPhase }),
    [navigate, variant, initialBootPhase],
  );

  const t = timing(reducedMotion, variant);
  const pageDimmed =
    variant === "default" && (phase === "out" || phase === "loader");
  const booting = initialBootPhase !== "done";

  const navDefaultOverlay =
    variant === "default" && (phase === "loader" || phase === "in");
  const bootDefaultOverlay =
    variant === "default" &&
    (initialBootPhase === "cover" || initialBootPhase === "reveal");
  const defaultOverlayPainted = navDefaultOverlay || bootDefaultOverlay;

  const overlayFadingOut =
    (variant === "default" && phase === "in") ||
    (variant === "default" && initialBootPhase === "reveal");

  const overlayBackdropBlur =
    overlayFadingOut || !defaultOverlayPainted ? "blur(0px)" : "blur(14px)";

  const overlayOpacity = overlayFadingOut
    ? 0
    : defaultOverlayPainted
      ? 1
      : 0;

  const overlayTransitionMs = overlayFadingOut
    ? t.in
    : initialBootPhase === "cover" && phase === "idle"
      ? 0
      : t.out;

  const logoResting = phase === "loader" || initialBootPhase === "cover";
  const logoExit =
    (variant === "default" && phase === "in") ||
    initialBootPhase === "reveal";

  const slideTransform =
    variant === "slide"
      ? initialBootPhase === "cover"
        ? "translateY(0)"
        : initialBootPhase === "reveal"
          ? "translateY(-100%)"
          : phase === "idle"
            ? "translateY(100%)"
            : phase === "in"
              ? "translateY(-100%)"
              : phase === "out" && !slideCoverReady
                ? "translateY(100%)"
                : "translateY(0)"
      : undefined;

  const slideTransformMs =
    variant === "slide"
      ? initialBootPhase === "reveal"
        ? t.in
        : initialBootPhase === "cover"
          ? 0
          : phase === "idle"
            ? 0
            : phase === "in"
              ? t.in
              : phase === "out"
                ? slideCoverReady
                  ? t.out
                  : 0
                : 0
      : 0;

  const slideLayerActive =
    variant === "slide" &&
    (phase !== "idle" ||
      initialBootPhase === "cover" ||
      initialBootPhase === "reveal");

  const contentTransitionMs =
    booting && initialBootPhase === "cover"
      ? 0
      : booting && initialBootPhase === "reveal"
        ? t.in
        : phase === "in" || phase === "idle"
          ? t.in
          : t.out;

  const contentEaseBootReveal =
    booting && initialBootPhase === "reveal"
      ? "cubic-bezier(0.22, 1, 0.36, 1)"
      : phase === "out" || phase === "loader"
        ? "cubic-bezier(0.4, 0, 0.2, 1)"
        : "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <PageTransitionContext.Provider value={ctx}>
      <div
        className={cn(
          "min-h-0 transition-[opacity,filter,transform,saturate]",
          pageDimmed &&
            "pointer-events-none opacity-[0.18] blur-[12px] scale-[0.991]",
          booting &&
            initialBootPhase === "cover" &&
            "pointer-events-none scale-[0.996] opacity-0 saturate-[0.88]",
          booting &&
            initialBootPhase === "reveal" &&
            "pointer-events-none scale-100 blur-0 opacity-100 saturate-100",
        )}
        style={{
          transitionDuration: `${contentTransitionMs}ms`,
          transitionTimingFunction: contentEaseBootReveal,
        }}
        {...(pageDimmed || booting ? { "aria-hidden": true as const } : {})}
      >
        {children}
      </div>

      {variant === "default" ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-[200] flex items-center justify-center transition-[opacity,backdrop-filter,-webkit-backdrop-filter]",
            initialBootPhase === "cover"
              ? "bg-[#0a0a0a]"
              : "bg-[#0a0a0a]/88",
          )}
          style={{
            opacity: overlayOpacity,
            backdropFilter: overlayBackdropBlur,
            WebkitBackdropFilter: overlayBackdropBlur,
            transitionDuration: `${overlayTransitionMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className={cn(
              "flex flex-col items-center transition-[opacity,transform,filter]",
              logoResting && !logoExit && "scale-100 opacity-100 blur-0",
              logoExit && "scale-105 opacity-0 blur-md",
              !logoResting &&
                !logoExit &&
                "scale-95 opacity-0 blur-sm",
            )}
            style={{
              transitionDuration: `${Math.max(t.out, 280)}ms`,
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <Image
              src="/MM_logo_NB-01.svg"
              alt=""
              width={140}
              height={136}
              className="h-16 w-auto opacity-90"
              aria-hidden
              priority
            />
            <span className="sr-only">Loading page</span>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "fixed inset-0 z-[200] overflow-hidden",
            !slideLayerActive && "pointer-events-none",
          )}
          {...(!slideLayerActive ? { "aria-hidden": true as const } : {})}
        >
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] shadow-[0_-24px_80px_rgba(0,0,0,0.45)] will-change-transform",
              !slideLayerActive && "pointer-events-none",
            )}
            style={{
              transform: slideTransform,
              transitionProperty: "transform",
              transitionDuration: `${slideTransformMs}ms`,
              transitionTimingFunction:
                phase === "in" || initialBootPhase === "reveal"
                  ? "cubic-bezier(0.22, 1, 0.36, 1)"
                  : "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Image
              src="/MM_logo_NB-01.svg"
              alt=""
              width={140}
              height={136}
              className="h-16 w-auto opacity-90"
              aria-hidden
              priority
            />
            <span className="sr-only">Loading page</span>
          </div>
        </div>
      )}
    </PageTransitionContext.Provider>
  );
}
