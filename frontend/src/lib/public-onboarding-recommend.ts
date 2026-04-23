/**
 * Lightweight rules for the public /onboarding wizard.
 * Output drives copy only — not contracts or pricing guarantees.
 */

export type OnboardingProjectId = "web" | "product" | "brand" | "other";

export type OnboardingTimelineId =
  | "super_soon"
  | "asap"
  | "mid"
  | "flexible";

export type OnboardingBudgetId =
  | "budget_1_3k"
  | "budget_3_10k"
  | "budget_10k_plus"
  | "prefer_not";

export type OnboardingRecommendation =
  | {
      mode: "subscription";
      serviceId: "design-partner";
    }
  | {
      mode: "closed_scope";
      serviceId: "launch-website" | "brand-sprint";
    };

export function getPublicOnboardingRecommendation(input: {
  project: OnboardingProjectId;
  timeline: OnboardingTimelineId;
  budget: OnboardingBudgetId;
}): OnboardingRecommendation {
  const { project, timeline, budget } = input;

  const higherBudget =
    budget === "budget_3_10k" || budget === "budget_10k_plus";
  const flexiblePartner =
    timeline === "flexible" && higherBudget && project !== "brand";

  if (flexiblePartner || (project === "product" && timeline === "flexible")) {
    return { mode: "subscription", serviceId: "design-partner" };
  }

  if (budget === "budget_10k_plus" && project !== "brand") {
    return { mode: "subscription", serviceId: "design-partner" };
  }

  if (project === "brand" || project === "other") {
    return { mode: "closed_scope", serviceId: "brand-sprint" };
  }

  if (project === "web") {
    return { mode: "closed_scope", serviceId: "launch-website" };
  }

  // product
  if (
    timeline === "super_soon" ||
    timeline === "asap" ||
    budget === "budget_1_3k" ||
    budget === "budget_3_10k"
  ) {
    return { mode: "closed_scope", serviceId: "launch-website" };
  }

  return { mode: "subscription", serviceId: "design-partner" };
}
