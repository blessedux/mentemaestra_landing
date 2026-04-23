import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, SquareKanban, Ticket } from "lucide-react";
import type { ReactNode } from "react";

export function ProcessFeatures() {
  return (
    <section className="bg-black py-16 text-foreground md:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
        <div className="mx-auto grid gap-4 lg:grid-cols-2">
          <FeatureCard>
            <CardHeading
              icon={SquareKanban}
              kicker="Backlog & creative work"
              title="Prioritize the work that actually moves the product."
              description="Triage requests, protect focus time for craft, and keep exploratory ideas from getting lost under day-to-day noise."
            />
          </FeatureCard>

          <FeatureCard>
            <CardHeading
              icon={Ticket}
              kicker="Tickets & team delivery"
              title="One place to see what is live, blocked, or shipping next."
              description="Track ongoing tickets with clear owners and dates, run projects as a team, and retire the endless “where is this?” threads."
            />
          </FeatureCard>

          <FeatureCard className="p-6 lg:col-span-2">
            <p className="mx-auto my-6 max-w-2xl text-balance text-center text-2xl font-semibold">
              A complete service: discovery, delivery, reviews, and handoff—so
              your backlog, production, and stakeholders stay aligned from kickoff
              to launch.
            </p>

            <div className="flex justify-center gap-6 overflow-hidden">
              <CircularUI
                label="Intake"
                circles={[{ pattern: "border" }, { pattern: "border" }]}
              />

              <CircularUI
                label="Build"
                circles={[{ pattern: "none" }, { pattern: "primary" }]}
              />

              <CircularUI
                label="Team sync"
                circles={[{ pattern: "blue" }, { pattern: "none" }]}
              />

              <CircularUI
                label="Ship"
                circles={[{ pattern: "primary" }, { pattern: "none" }]}
                className="hidden sm:block"
              />
            </div>
          </FeatureCard>
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
  <Card className={cn("group relative rounded-none shadow-zinc-950/5", className)}>
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2" />
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2" />
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2" />
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2" />
  </>
);

interface CardHeadingProps {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
}

const CardHeading = ({
  icon: Icon,
  kicker,
  title,
  description,
}: CardHeadingProps) => (
  <div className="p-6">
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
  label: string;
  circles: CircleConfig[];
  className?: string;
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
  <div className={className}>
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
    <span className="text-muted-foreground mt-1.5 block text-center text-sm">
      {label}
    </span>
  </div>
);
