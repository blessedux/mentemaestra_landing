"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/LocaleProvider";
import { LucideIcon, SquareKanban, Ticket } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";

function HighlightOnScroll({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.span
      className="relative inline-block text-primary"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      variants={{
        hidden: {},
        show: {},
      }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-x-0 bottom-[0.15em] -z-10 h-[0.55em] rounded-sm bg-primary/20"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: 0 }}
      />
      <motion.span
        initial={{ opacity: 0.65 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.4, delay }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

function renderInlineHighlights(
  text: string,
  tokens: readonly { token: string; delay?: number }[],
  baseDelay = 0,
) {
  let out: ReactNode[] = [text];

  for (const t of tokens) {
    out = out.flatMap((part, idx) => {
      if (typeof part !== "string") return [part];
      if (!part.includes(t.token)) return [part];
      const chunks = part.split(t.token);
      const nodes: ReactNode[] = [];
      chunks.forEach((chunk, i) => {
        if (chunk) nodes.push(chunk);
        if (i < chunks.length - 1) {
          nodes.push(
            <HighlightOnScroll
              key={`${t.token}-${idx}-${i}`}
              delay={baseDelay + (t.delay ?? 0)}
            >
              {t.token}
            </HighlightOnScroll>,
          );
        }
      });
      return nodes;
    });
  }

  return out;
}

function renderLeadWithHighlights(lead: string, baseDelay = 0) {
  return renderInlineHighlights(
    lead,
    [
      { token: "sin fricción.", delay: 0.05 },
      { token: "alineados", delay: 0.14 },
      { token: "frictionless.", delay: 0.05 },
      { token: "aligned", delay: 0.14 },
    ] as const,
    baseDelay,
  );
}

function AnimatedCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [inView, setInView] = useState(false);

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: false, amount: 0.35, margin: "-96px 0px -72px 0px" }}
      onViewportEnter={() => setInView(true)}
      onViewportLeave={() => setInView(false)}
    >
      {children}
    </motion.div>
  );
}

export function ProcessFeatures() {
  const { t } = useLocale();
  const copy = t.processFeatures;
  const [hoveredStep, setHoveredStep] = useState<
    "diagnostico" | "produccion" | "alineacion" | "lanzamiento" | null
  >(null);

  const steps = useMemo(
    () => [
      {
        id: "diagnostico" as const,
        circles: [{ pattern: "border" }, { pattern: "border" }] as const,
        title: copy.bottomCard.steps.diagnostico.title,
        description: copy.bottomCard.steps.diagnostico.description,
      },
      {
        id: "produccion" as const,
        circles: [{ pattern: "none" }, { pattern: "primary" }] as const,
        title: copy.bottomCard.steps.produccion.title,
        description: copy.bottomCard.steps.produccion.description,
      },
      {
        id: "alineacion" as const,
        circles: [{ pattern: "blue" }, { pattern: "none" }] as const,
        title: copy.bottomCard.steps.alineacion.title,
        description: copy.bottomCard.steps.alineacion.description,
      },
      {
        id: "lanzamiento" as const,
        circles: [{ pattern: "primary" }, { pattern: "none" }] as const,
        title: copy.bottomCard.steps.lanzamiento.title,
        description: copy.bottomCard.steps.lanzamiento.description,
      },
    ],
    [copy.bottomCard.steps],
  );

  return (
    <section className="bg-black py-16 text-foreground md:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-6xl">
        <div className="mx-auto grid gap-4 lg:grid-cols-2">
          <AnimatedCard delay={0} className="h-full">
            <FeatureCard>
              <CardHeading
                icon={SquareKanban}
                kicker={copy.cards.backlog.kicker}
                title={renderInlineHighlights(
                  copy.cards.backlog.title,
                  [{ token: "on-demand partner.", delay: 0.1 }] as const,
                  0.55,
                )}
                description={copy.cards.backlog.description}
              />
            </FeatureCard>
          </AnimatedCard>

          <AnimatedCard delay={0.08} className="h-full">
            <FeatureCard>
              <CardHeading
                icon={Ticket}
                kicker={copy.cards.tickets.kicker}
                title={renderInlineHighlights(
                  copy.cards.tickets.title,
                  [
                    { token: "monitorear", delay: 0.1 },
                    { token: "proceso", delay: 0.18 },
                    { token: "monitor", delay: 0.1 },
                    { token: "in progress", delay: 0.18 },
                  ] as const,
                  0.08 + 0.55,
                )}
                description={copy.cards.tickets.description}
              />
            </FeatureCard>
          </AnimatedCard>

          <AnimatedCard delay={0.16} className="lg:col-span-2">
            <FeatureCard className="p-6">
              <p className="mx-auto my-6 max-w-2xl text-balance text-center text-2xl font-semibold">
                {renderLeadWithHighlights(copy.bottomCard.lead, 0.16 + 0.55)}
              </p>

              <div
                className="grid grid-cols-2 justify-items-center gap-8 overflow-hidden sm:grid-cols-4"
                onMouseLeave={() => setHoveredStep(null)}
              >
                {steps.map((step) => (
                  <CircularUI
                    key={step.id}
                    id={step.id}
                    title={step.title}
                    description={step.description}
                    circles={[...step.circles]}
                    hoveredStep={hoveredStep}
                    onHoverChange={setHoveredStep}
                    className={undefined}
                  />
                ))}
              </div>
            </FeatureCard>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card className={cn("group relative h-full rounded-none shadow-zinc-950/5", className)}>
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
  </>
);

interface CardHeadingProps {
  icon: LucideIcon;
  kicker: string;
  title: ReactNode;
  description: ReactNode;
}

const CardHeading = ({
  icon: Icon,
  kicker,
  title,
  description,
}: CardHeadingProps) => (
  <div className="flex h-full flex-col p-6">
    <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 shrink-0" aria-hidden />
      {kicker}
    </span>
    <p className="mt-4 text-2xl font-semibold leading-snug">{title}</p>
    <p className="text-muted-foreground mt-3 text-base leading-relaxed">
      {description}
    </p>
  </div>
);

interface CircleConfig {
  pattern: "none" | "border" | "primary" | "blue";
}

interface CircularUIProps {
  id: "diagnostico" | "produccion" | "alineacion" | "lanzamiento";
  title: string;
  description: string;
  circles: CircleConfig[];
  className?: string;
  hoveredStep: "diagnostico" | "produccion" | "alineacion" | "lanzamiento" | null;
  onHoverChange: (
    next: "diagnostico" | "produccion" | "alineacion" | "lanzamiento" | null,
  ) => void;
}

const CircularUI = ({
  id,
  title,
  description,
  circles,
  className,
  hoveredStep,
  onHoverChange,
}: CircularUIProps) => {
  const isActive = hoveredStep === id;
  const isDimmed = hoveredStep !== null && hoveredStep !== id;

  return (
    <div className={cn("flex w-full max-w-[12rem] flex-col items-center", className)}>
      <div
        className={cn(
          "transition-[filter,opacity] duration-300",
          isDimmed && "blur-[2px] opacity-50",
        )}
        onMouseEnter={() => onHoverChange(id)}
        onMouseLeave={() => onHoverChange(null)}
      >
        <div className="bg-gradient-to-b from-border size-fit rounded-2xl to-transparent p-px">
          <div className="bg-gradient-to-b from-background to-muted/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
            {circles.map((circle, i) => (
              <div
                key={i}
                className={cn("size-7 rounded-full border sm:size-8", {
                  "border-primary": circle.pattern === "none",
                  "border-primary bg-[repeating-linear-gradient(-45deg,hsl(var(--border)),hsl(var(--border))_1px,transparent_1px,transparent_4px)]":
                    circle.pattern === "border",
                  "border-primary bg-background bg-[repeating-linear-gradient(-45deg,hsl(var(--primary)),hsl(var(--primary))_1px,transparent_1px,transparent_4px)]":
                    circle.pattern === "primary",
                  "bg-background z-1 border-blue-500 bg-[repeating-linear-gradient(-45deg,theme(colors.blue.500),theme(colors.blue.500)_1px,transparent_1px,transparent_4px)]":
                    circle.pattern === "blue",
                })}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-3 min-h-[2.75rem] text-center",
          isDimmed && "opacity-0 transition-opacity duration-300",
        )}
      >
        <p className="mx-auto max-w-[18rem] text-sm font-medium leading-snug text-foreground">
          <motion.span
            layout="position"
            className="inline-block"
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.span>
          <AnimatePresence initial={false}>
            {isActive ? (
              <motion.span
                key="desc"
                className="text-muted-foreground font-normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {": "}
                {description}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
};
