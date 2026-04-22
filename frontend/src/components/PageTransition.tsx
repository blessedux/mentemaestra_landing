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
  const [slideCoverReady, setSlideCoverReady] = useState(false);
  const pendingPathRef = useRef<string | null>(null);
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
    inflightRef.current = false;
    completingRef.current = false;
  }, [reducedMotion, variant]);

  const currentKey = pathWithSearch(pathname, searchParams);

  useEffect(() => {
    if (variant !== "slide") return;
    if (phase === "out") {
      setSlideCoverReady(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideCoverReady(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setSlideCoverReady(phase !== "idle");
  }, [phase, variant]);

  useEffect(() => {
    if (phase !== "loader" || !pendingPathRef.current) return;
    if (currentKey !== pendingPathRef.current) return;
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

  const isHashOnlyOnSamePage = useCallback((url: URL) => {
    const cur = new URL(window.location.href);
    return url.pathname === cur.pathname && url.search === cur.search;
  }, []);

  const navigate = useCallback(
    async (href: string) => {
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
      const t = timing(reducedMotion, variant);

      setPhase("out");
      await new Promise((r) => setTimeout(r, t.out));
      setPhase("loader");

      const dest = `${url.pathname}${url.search}${url.hash}`;
      router.push(dest);
    },
    [router, reducedMotion, variant, isHashOnlyOnSamePage],
  );

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
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
      const destKey = `${url.pathname}${url.search}`;
      const liveKey = `${window.location.pathname}${window.location.search}`;
      if (destKey === liveKey && !url.hash) return;
      e.preventDefault();
      void navigate(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [phase, navigate, isHashOnlyOnSamePage]);

  const ctx = useMemo(
    () => ({ navigate, variant }),
    [navigate, variant],
  );

  const t = timing(reducedMotion, variant);
  const pageDimmed =
    variant === "default" && (phase === "out" || phase === "loader");
  const defaultOverlayOpen = variant === "default" && (phase === "loader" || phase === "in");

  const slideTransform =
    variant === "slide"
      ? phase === "idle"
        ? "translateY(100%)"
        : phase === "in"
          ? "translateY(-100%)"
          : phase === "out" && !slideCoverReady
            ? "translateY(100%)"
            : "translateY(0)"
      : undefined;

  const slideTransformMs =
    variant === "slide"
      ? phase === "idle"
        ? 0
        : phase === "in"
          ? t.in
          : phase === "out"
            ? slideCoverReady
              ? t.out
              : 0
            : 0
      : 0;

  const slideLayerActive = variant === "slide" && phase !== "idle";

  return (
    <PageTransitionContext.Provider value={ctx}>
      <div
        className={cn(
          "min-h-0 transition-[opacity,filter,transform]",
          pageDimmed &&
            "pointer-events-none opacity-[0.18] blur-[12px] scale-[0.991]",
        )}
        style={{
          transitionDuration: `${phase === "in" || phase === "idle" ? t.in : t.out}ms`,
          transitionTimingFunction:
            phase === "out" || phase === "loader"
              ? "cubic-bezier(0.4, 0, 0.2, 1)"
              : "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        {...(pageDimmed ? { "aria-hidden": true as const } : {})}
      >
        {children}
      </div>

      {variant === "default" ? (
        <div
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0a0a]/88 transition-[opacity,backdrop-filter]"
          style={{
            opacity: defaultOverlayOpen ? (phase === "in" ? 0 : 1) : 0,
            backdropFilter:
              phase === "in" || phase === "idle" ? "blur(0px)" : "blur(14px)",
            WebkitBackdropFilter:
              phase === "in" || phase === "idle" ? "blur(0px)" : "blur(14px)",
            transitionDuration: `${phase === "in" ? t.in : t.out}ms`,
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className={cn(
              "flex flex-col items-center transition-[opacity,transform,filter]",
              phase === "loader"
                ? "scale-100 opacity-100 blur-0"
                : phase === "in"
                  ? "scale-105 opacity-0 blur-md"
                  : "scale-95 opacity-0 blur-sm",
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
                phase === "in"
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
