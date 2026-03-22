"use client"

import React, { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Root } from "@bsmnt/scrollytelling"
import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger"
import { GradientBackground } from "@/components/ui/paper-design-shader-background"
import { IconHover3D } from "@/components/ui/icon-3d-hover"
import { ProcessBento } from "@/components/ui/process-bento"
import {
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Globe,
  Hexagon,
  Layers,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** Placeholder “logos” — swap for real assets later */
const LOGO_PLACEHOLDERS: { Icon: LucideIcon; label: string }[] = [
  { Icon: Building2, label: "Marca placeholder" },
  { Icon: Hexagon, label: "Marca placeholder" },
  { Icon: Layers, label: "Marca placeholder" },
  { Icon: Sparkles, label: "Marca placeholder" },
  { Icon: Globe, label: "Marca placeholder" },
  { Icon: Cpu, label: "Marca placeholder" },
  { Icon: Box, label: "Marca placeholder" },
  { Icon: Zap, label: "Marca placeholder" },
]

/** Toggle off when you’re done debugging layout/sizing */
const DEBUG_SECTION_BORDERS = false

/** Outlines every descendant inside the process stack (see globals `.home-process-debug`) */
const DEBUG_PROCESS_SUBTREE = false

/** Blur stays 0 at scroll 0, then ramps in so the top of the page is always sharp at rest. */
const HERO_BLUR_SCROLL_GATE_PX = 96

export default function HomePage() {
  const [heroBlurPx, setHeroBlurPx] = useState(0)
  const [processBgOpacity, setProcessBgOpacity] = useState(0)
  const [logosTriggerEl, setLogosTriggerEl] = useState<HTMLElement | null>(null)
  const [processTriggerEl, setProcessTriggerEl] = useState<HTMLElement | null>(null)

  const onLogosScroll = useCallback((self: ScrollTriggerInstance) => {
    const y = typeof window !== "undefined" ? window.scrollY : 0
    const gate = Math.min(1, Math.max(0, y / HERO_BLUR_SCROLL_GATE_PX))
    setHeroBlurPx(Math.min(100, Math.max(0, self.progress * 100 * gate)))
  }, [])

  const onProcessScroll = useCallback((self: ScrollTriggerInstance) => {
    setProcessBgOpacity(Math.min(1, Math.max(0, self.progress)))
  }, [])

  const logosCallbacks = useMemo(
    () => ({
      onUpdate: onLogosScroll,
    }),
    [onLogosScroll]
  )

  const processCallbacks = useMemo(
    () => ({
      onUpdate: onProcessScroll,
    }),
    [onProcessScroll]
  )

  const scrollToProcessSection = useCallback(() => {
    document.getElementById("home-process")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [])

  return (
    <div className="relative overflow-x-hidden">
      <GradientBackground blurPx={heroBlurPx} />
      {/* gap-0 so hero + logos share a true seam; spacing after logos on following sections */}
      <main className="relative z-10 flex flex-col gap-0 overflow-x-hidden">
        {/* Hero — center on mobile, left on lg */}
        <section
          className={cn(DEBUG_SECTION_BORDERS && "border-2 border-red-500/70")}
        >
          <div className="relative isolate pb-24 md:pb-32 lg:pb-36">
            <div className="hero-copy-offset relative mx-auto flex w-full max-w-7xl flex-col max-lg:px-6 lg:mx-0 lg:max-w-none">
              <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center lg:mx-0 lg:max-w-2xl lg:items-start lg:text-left">
                <h1 className="max-w-2xl text-balance text-5xl font-medium tracking-tight text-foreground md:text-6xl xl:text-7xl">
                  <span className="block">Eleva tu marca</span>
                  <span className="block">con MenteMaestra</span>
                </h1>
                <p className="mt-8 max-w-2xl text-balance text-lg leading-relaxed text-foreground">
                  Gestiona tus proyectos de diseño, branding y web apps desde un solo lugar.
                </p>

                <div className="hero-ctas hero-cta-offset isolate flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:max-w-none lg:justify-start">
                  <Link
                    href="/projects"
                    data-cta="primary"
                    className={cn(
                      "group inline-flex h-12 w-full max-w-[280px] min-w-0 items-center justify-center rounded-full px-8 text-base font-medium whitespace-nowrap sm:w-auto sm:min-w-[240px]",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "shadow-sm shadow-black/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                  >
                    <span className="text-nowrap">Comenzar</span>
                    <ChevronRight
                      className="ml-1 size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                  <Link
                    target="_blank"
                    href="https://calendly.com/inboxmentemaestra/30min"
                    rel="noopener noreferrer"
                    data-cta="demo"
                    className={cn(
                      "inline-flex h-12 w-full max-w-[280px] min-w-0 items-center justify-center rounded-full px-8 text-base font-medium whitespace-nowrap sm:w-auto sm:min-w-[240px]",
                      "transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                  >
                    <span className="text-nowrap">Solicitar una demo</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logos Section — @bsmnt/scrollytelling Root drives hero background blur (ScrollTrigger scrub) */}
        <section
          id="home-logos"
          ref={setLogosTriggerEl}
          className={cn(
            "logo-carousel-section flex min-h-[min(42vh,420px)] flex-col bg-transparent pb-6 md:min-h-[min(48vh,520px)]",
            DEBUG_SECTION_BORDERS && "border-2 border-sky-500/70"
          )}
        >
          <div className="logo-carousel-content flex w-full max-w-none shrink-0 justify-end">
            <div className="flex w-full min-w-0 flex-col-reverse items-end gap-2 md:flex-row md:items-center md:justify-end md:gap-10">
              <div className="w-full shrink-0 md:max-w-44 md:border-r md:border-white/25 md:pr-6">
                <p className="text-end text-sm font-medium text-white">
                  Impulsando a los mejores equipos
                </p>
              </div>
              <div className="logo-marquee-container relative w-full min-w-0 overflow-hidden py-0 md:flex-1">
                <div className="flex w-max animate-logo-marquee gap-28">
                  {[...LOGO_PLACEHOLDERS, ...LOGO_PLACEHOLDERS].map((item, i) => {
                    const { Icon, label } = item
                    return (
                      <div
                        key={`${label}-${i}`}
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-transparent text-white"
                      >
                        <Icon className="size-5 text-white opacity-90" aria-hidden />
                        <span className="sr-only">{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* flex-1 + justify-end: chevron sits on the lower part of the section (margin-top is unreliable here) */}
          <div className="pointer-events-none flex min-h-0 flex-1 flex-col justify-end">
            <div className="flex w-full justify-center pt-10 pb-1 md:pt-12">
              <button
                type="button"
                onClick={scrollToProcessSection}
                aria-label="Desplazarse a la siguiente sección"
                className="pointer-events-auto inline-flex flex-col items-center gap-1 rounded-full p-2 text-white/85 transition hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <ChevronDown className="size-9 motion-safe:animate-bounce md:size-10" aria-hidden />
              </button>
            </div>
          </div>
        </section>

        {logosTriggerEl ? (
          <Root
            trigger={logosTriggerEl}
            start="top bottom"
            end="center center"
            scrub={0.45}
            callbacks={logosCallbacks}
          />
        ) : null}

        {/* The Process Section — scroll-fading solid backdrop */}
        <section
          id="home-process"
          ref={setProcessTriggerEl}
          className={cn(
            "relative mt-16 flex flex-col items-center justify-center py-20 md:mt-24 md:py-28",
            DEBUG_SECTION_BORDERS && "border-2 border-emerald-500/70"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 -z-[1]"
            style={{
              backgroundColor: "oklch(0.145 0 0)",
              opacity: processBgOpacity,
            }}
            aria-hidden
          />
          <div
            className={cn(
              "relative z-0 box-border flex w-full max-w-full flex-col items-center gap-12 px-[12px] md:gap-16",
              DEBUG_PROCESS_SUBTREE && "home-process-debug"
            )}
          >
            <IconHover3D
              heading="The Process"
              text="Your partner through every stage."
              className="mb-0 mt-10 md:mt-16"
            />
            <ProcessBento />
          </div>
        </section>

        {processTriggerEl ? (
          <Root
            trigger={processTriggerEl}
            start="top 92%"
            end="top 18%"
            scrub={0.35}
            callbacks={processCallbacks}
          />
        ) : null}

        <section
          className={cn(
            "relative mt-16 flex min-h-screen items-center justify-center py-20 md:mt-24",
            DEBUG_SECTION_BORDERS && "border-2 border-fuchsia-500/70"
          )}
        >
          <div className="mx-auto w-full max-w-5xl px-6 text-center">
            <h2 className="mb-6 text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Sección 3
            </h2>
            <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
              Otra sección con el mismo gradiente de fondo
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
