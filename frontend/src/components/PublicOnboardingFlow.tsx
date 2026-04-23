"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import BookMeetingInline from "@/components/BookMeetingInline";
import { WarningIcon } from "@/components/notion/PortalSupportButton";
import { useLocale } from "@/i18n/LocaleProvider";
import type { MessagesByLocale } from "@/i18n/messages";
import {
  getPublicOnboardingRecommendation,
  type OnboardingBudgetId,
  type OnboardingProjectId,
  type OnboardingRecommendation,
  type OnboardingTimelineId,
} from "@/lib/public-onboarding-recommend";
import { cn } from "@/lib/utils";

const STEPS_TOTAL = 4;

const PROJECT_IDS = [
  "web",
  "product",
  "brand",
  "other",
] as const satisfies readonly OnboardingProjectId[];

const TIMELINE_IDS_MAIN = [
  "asap",
  "mid",
  "flexible",
] as const satisfies readonly OnboardingTimelineId[];

const BUDGET_IDS = [
  "budget_1_3k",
  "budget_3_10k",
  "budget_10k_plus",
  "prefer_not",
] as const satisfies readonly OnboardingBudgetId[];

function BoldChunks({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    if (m) {
      return (
        <strong key={i} className="font-semibold text-white">
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function RecommendationExplainerCard({
  recommendation,
  t,
}: {
  recommendation: OnboardingRecommendation;
  t: MessagesByLocale;
}) {
  const ex = t.onboarding.result.explainer;
  const block =
    recommendation.mode === "subscription"
      ? ex.designPartner
      : recommendation.serviceId === "brand-sprint"
        ? ex.brandSprint
        : ex.launchWebsite;

  const serviceId =
    recommendation.mode === "subscription"
      ? "design-partner"
      : recommendation.serviceId;
  const serviceItem = t.services.items.find((i) => i.id === serviceId);
  const serviceName = serviceItem?.name ?? serviceId;

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/50 p-6 text-left md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {ex.cardTitle}
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-white md:text-xl">
        {serviceName}
      </h3>
      <dl className="mt-6 space-y-5 text-sm text-zinc-300">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            {ex.timeframeLabel}
          </dt>
          <dd className="mt-1.5 leading-relaxed">
            <BoldChunks text={block.timeframe} />
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            {ex.processLabel}
          </dt>
          <dd className="mt-1.5 leading-relaxed">
            <BoldChunks text={block.process} />
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            {ex.deliverablesLabel}
          </dt>
          <dd className="mt-1.5 leading-relaxed">
            <BoldChunks text={block.deliverables} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

type ChoiceCardProps = {
  selected: boolean;
  onSelect: () => void;
  label: string;
  line?: string;
};

function ChoiceCard({ selected, onSelect, label, line }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
        selected
          ? "border-accent/70 bg-zinc-900/80 text-white"
          : "border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/50",
      )}
    >
      <span className="block text-sm font-medium">{label}</span>
      {line ? (
        <span className="mt-0.5 block text-xs text-zinc-500">{line}</span>
      ) : null}
    </button>
  );
}

type SuperSoonOption = {
  labelPrefix: string;
  labelTail: string;
  line: string;
};

function SuperSoonTimelineButton({
  selected,
  onSelect,
  option,
  selectedSuffix,
}: {
  selected: boolean;
  onSelect: () => void;
  option: SuperSoonOption;
  selectedSuffix: string;
}) {
  const prefixCore = option.labelPrefix.trimEnd();
  const baseLabel = `${prefixCore} ${option.labelTail}, ${option.line}`;
  const ariaLabel = selected ? `${baseLabel}${selectedSuffix}` : baseLabel;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
        selected
          ? "border-accent/70 bg-zinc-900/80 text-white"
          : "border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/50",
      )}
    >
      <span className="flex items-start gap-2">
        <WarningIcon className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500/80" />
        <span className="flex flex-col">
          <span className="text-sm font-medium">
            {prefixCore}{" "}
            <span className="font-semibold uppercase tracking-wide text-white">
              {option.labelTail}
            </span>
          </span>
          <span className="mt-0.5 text-xs text-zinc-500">{option.line}</span>
        </span>
      </span>
    </button>
  );
}

export default function PublicOnboardingFlow() {
  const { t } = useLocale();
  const router = useRouter();
  const o = t.onboarding;

  const [step, setStep] = useState(0);
  const [project, setProject] = useState<OnboardingProjectId | null>(null);
  const [timeline, setTimeline] = useState<OnboardingTimelineId | null>(null);
  const [budget, setBudget] = useState<OnboardingBudgetId | null>(null);

  const recommendation = useMemo(() => {
    if (!project || !timeline || !budget) return null;
    return getPublicOnboardingRecommendation({ project, timeline, budget });
  }, [project, timeline, budget]);

  const stepLabel = (n: number) =>
    o.stepOf.replace("{n}", String(n)).replace("{total}", String(STEPS_TOTAL));

  const primaryBlurb = useMemo(() => {
    if (!recommendation) return "";
    if (recommendation.mode === "subscription") {
      return o.result.primaryDesignPartner;
    }
    if (recommendation.serviceId === "brand-sprint") {
      return o.result.primaryBrandSprint;
    }
    return o.result.primaryLaunch;
  }, [recommendation, o.result]);

  const canNext =
    step === 0
      ? Boolean(project)
      : step === 1
        ? Boolean(timeline)
        : step === 2
          ? Boolean(budget)
          : false;

  const goNext = () => {
    if (step < STEPS_TOTAL - 1 && canNext) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 md:px-6 md:pt-14">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
        {o.stepLabel}
      </p>
      <p className="mt-2 text-center text-sm text-zinc-400">
        {stepLabel(step + 1)}
      </p>

      {step === 0 ? (
        <div className="mt-10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {o.question}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-400">
            {o.hint}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {PROJECT_IDS.map((id) => (
              <ChoiceCard
                key={id}
                selected={project === id}
                onSelect={() => setProject(id)}
                label={o.types[id]}
              />
            ))}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {o.timeline.question}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-400">
            {o.timeline.hint}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {TIMELINE_IDS_MAIN.map((id) => {
              const opt = o.timeline.options[id];
              return (
                <ChoiceCard
                  key={id}
                  selected={timeline === id}
                  onSelect={() => setTimeline(id)}
                  label={opt.label}
                  line={opt.line}
                />
              );
            })}
            <SuperSoonTimelineButton
              selected={timeline === "super_soon"}
              onSelect={() => setTimeline("super_soon")}
              option={o.timeline.options.super_soon}
              selectedSuffix={o.timeline.selectedSuffix}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {o.budget.question}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-400">
            {o.budget.hint}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {BUDGET_IDS.map((id) => {
              const opt = o.budget.options[id];
              return (
                <ChoiceCard
                  key={id}
                  selected={budget === id}
                  onSelect={() => setBudget(id)}
                  label={opt.label}
                  line={opt.line}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 3 && recommendation ? (
        <div className="mt-10 space-y-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {o.result.title}
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
              {o.result.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/35 p-6 text-left md:p-8">
            <p className="text-sm leading-relaxed text-zinc-300">
              <BoldChunks text={primaryBlurb} />
            </p>
          </div>

          <RecommendationExplainerCard recommendation={recommendation} t={t} />

          <BookMeetingInline
            dialogAriaLabel={o.result.dialogAriaLabel}
            onAfterBackHome={() => {
              router.push("/");
            }}
            intro={
              <div className="mb-8 text-center">
                <div className="mb-3 flex justify-center">
                  <span className="text-xs uppercase tracking-[0.2em] text-accent">
                    {o.result.bookEyebrow}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white md:text-2xl">
                  {o.result.bookTitle}
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
                  {o.result.bookSubtitle}
                </p>
              </div>
            }
          />

          <div className="flex justify-center pb-8">
            <Link
              href="/"
              className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
            >
              {o.result.backToHome}
            </Link>
          </div>
        </div>
      ) : null}

      {step < 3 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-8">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className={cn(
              "text-sm font-medium transition-colors",
              step === 0
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {o.actions.back}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className={cn(
              "rounded-full px-6 py-2.5 text-sm font-medium transition-colors",
              canNext
                ? "bg-white text-black hover:bg-zinc-100"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500",
            )}
          >
            {o.actions.next}
          </button>
        </div>
      ) : null}
    </div>
  );
}
