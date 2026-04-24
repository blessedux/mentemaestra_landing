import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_ONBOARDING_SUPPORT_EMAIL,
  getOnboardingSupportEmail,
} from "./onboarding-env";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getOnboardingSupportEmail", () => {
  it("defaults to soporte@mentemaestra.studio when unset", () => {
    delete process.env.ONBOARDING_SUPPORT_EMAIL;
    delete process.env.BOOKING_ORGANIZER_EMAIL;
    expect(getOnboardingSupportEmail()).toBe(DEFAULT_ONBOARDING_SUPPORT_EMAIL);
  });

  it("does not fall back to BOOKING_ORGANIZER_EMAIL", () => {
    delete process.env.ONBOARDING_SUPPORT_EMAIL;
    process.env.BOOKING_ORGANIZER_EMAIL = "inboxmentemaestra@gmail.com";
    expect(getOnboardingSupportEmail()).toBe(DEFAULT_ONBOARDING_SUPPORT_EMAIL);
  });

  it("honors ONBOARDING_SUPPORT_EMAIL when set", () => {
    process.env.ONBOARDING_SUPPORT_EMAIL = "hola@mentemaestra.studio";
    expect(getOnboardingSupportEmail()).toBe("hola@mentemaestra.studio");
  });
});
