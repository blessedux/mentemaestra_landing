"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GradientBackground } from "@/components/ui/paper-design-shader-background"
import { ChevronRight } from "lucide-react"

const LOGOS: { src: string; alt: string; heightClass: string }[] = [
  { src: "https://html.tailus.io/blocks/customers/nvidia.svg", alt: "Nvidia", heightClass: "h-4" },
  { src: "https://html.tailus.io/blocks/customers/column.svg", alt: "Column", heightClass: "h-3" },
  { src: "https://html.tailus.io/blocks/customers/github.svg", alt: "GitHub", heightClass: "h-3" },
  { src: "https://html.tailus.io/blocks/customers/nike.svg", alt: "Nike", heightClass: "h-4" },
  { src: "https://html.tailus.io/blocks/customers/lemonsqueezy.svg", alt: "Lemon Squeezy", heightClass: "h-4" },
  { src: "https://html.tailus.io/blocks/customers/laravel.svg", alt: "Laravel", heightClass: "h-3" },
  { src: "https://html.tailus.io/blocks/customers/lilly.svg", alt: "Lilly", heightClass: "h-5" },
  { src: "https://html.tailus.io/blocks/customers/openai.svg", alt: "OpenAI", heightClass: "h-5" },
]

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden min-h-screen">
      <GradientBackground />
      <div className="fixed inset-0 -z-[9] bg-black/20 pointer-events-none" aria-hidden />
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center lg:justify-start relative">
          <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 py-16 md:py-20 lg:py-24">
            <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
              <h1 className="max-w-2xl text-balance text-4xl md:text-5xl xl:text-6xl text-foreground font-semibold tracking-tight">
                Diseña tu marca con MenteMaestra
              </h1>
              <p className="mt-6 max-w-2xl text-balance text-base md:text-lg text-muted-foreground">
                Gestiona tus proyectos de diseño, branding y web apps desde un solo lugar.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full pl-5 pr-3 text-base w-full sm:w-auto"
                >
                  <Link href="/projects">
                    <span className="text-nowrap">Comenzar</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  key="demo"
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-full px-5 text-base hover:bg-zinc-950/5 dark:hover:bg-white/5 w-full sm:w-auto"
                >
                  <Link target="_blank" href="https://calendly.com/inboxmentemaestra/30min" rel="noopener noreferrer">
                    <span className="text-nowrap">Solicitar una demo</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[min(40%,320px)] aspect-[2/3] overflow-hidden rounded-3xl border border-black/10 sm:aspect-video lg:rounded-[3rem] dark:border-white/5 pointer-events-none hidden lg:block">
              <div className="size-full bg-gradient-to-br from-primary/20 to-primary/5 opacity-50 dark:opacity-35 dark:lg:opacity-75" />
            </div>
          </div>
        </section>

        {/* Logos Section */}
        <section className="h-screen flex items-center justify-center relative">
          <div className="w-full bg-background/50 backdrop-blur-sm relative">
            <div className="group relative m-auto max-w-5xl px-6">
              <div className="flex flex-col items-center md:flex-row">
                <div className="md:max-w-32 md:border-r md:border-white/20 md:pr-4">
                  <p className="text-end text-xs md:text-sm">Impulsando a los mejores equipos</p>
                </div>
                <div className="relative py-4 md:w-[calc(100%-8rem)] overflow-hidden">
                  <div className="flex items-center justify-center gap-16 flex-nowrap">
                    {LOGOS.map((logo) => (
                      <div key={logo.alt} className="flex flex-shrink-0">
                        <img
                          className={`mx-auto w-fit dark:invert ${logo.heightClass}`}
                          src={logo.src}
                          alt={`${logo.alt} Logo`}
                          height={logo.heightClass === "h-5" ? 20 : logo.heightClass === "h-4" ? 16 : 12}
                          width="auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Second Additional Section */}
        <section className="min-h-screen flex items-center justify-center relative py-20">
          <div className="w-full max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Sección 2
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Contenido adicional con el mismo gradiente de fondo
            </p>
          </div>
        </section>

        {/* Third Additional Section */}
        <section className="min-h-screen flex items-center justify-center relative py-20">
          <div className="w-full max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Sección 3
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Otra sección con el mismo gradiente de fondo
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
