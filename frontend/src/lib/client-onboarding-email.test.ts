import { describe, expect, it } from "vitest";

import {
  RESEND_CLIENT_ONBOARDING_VARIABLE_KEYS,
  buildClientOnboardingText,
  buildClientOnboardingVars,
  buildResendClientOnboardingVariables,
} from "./client-onboarding-email";

describe("buildClientOnboardingVars", () => {
  it("caps the preheader at 140 chars and keeps the project name inline", () => {
    const vars = buildClientOnboardingVars({
      clientName: "Ada",
      projectName: "X".repeat(300),
      ctaUrl: "https://example.com/client-access/t",
      supportEmail: "hola@example.com",
    });
    expect(vars.preheader.length).toBeLessThanOrEqual(140);
    expect(vars.headline).toContain("MenteMaestra");
    expect(vars.clientName).toBe("Ada");
    expect(vars.ctaUrl).toBe("https://example.com/client-access/t");
  });
});

describe("buildResendClientOnboardingVariables", () => {
  it("HTML-escapes text fields and & in the CTA URL", () => {
    const map = buildResendClientOnboardingVariables({
      preheader: "p",
      headline: "h",
      clientName: `Tom & <Jerry>`,
      projectName: `"Alpha"`,
      ctaUrl: "https://example.com/a?x=1&y=2",
      supportEmail: "hi@example.com",
    });
    expect(map.CLIENT_NAME).toBe("Tom &amp; &lt;Jerry&gt;");
    expect(map.PROJECT_NAME).toBe("&quot;Alpha&quot;");
    expect(map.CTA_URL).toBe("https://example.com/a?x=1&amp;y=2");
  });

  it("emits exactly the declared key set", () => {
    const map = buildResendClientOnboardingVariables({
      preheader: "",
      headline: "",
      clientName: "",
      projectName: "",
      ctaUrl: "",
      supportEmail: "",
    });
    expect(Object.keys(map).sort()).toEqual(
      [...RESEND_CLIENT_ONBOARDING_VARIABLE_KEYS].sort(),
    );
  });
});

describe("buildClientOnboardingText", () => {
  it("includes the CTA URL and support email", () => {
    const text = buildClientOnboardingText({
      preheader: "p",
      headline: "Bienvenido",
      clientName: "Ada",
      projectName: "Demo",
      ctaUrl: "https://example.com/client-access/tok",
      supportEmail: "hola@mentemaestra.studio",
    });
    expect(text).toContain("Ada");
    expect(text).toContain("Demo");
    expect(text).toContain("https://example.com/client-access/tok");
    expect(text).toContain("hola@mentemaestra.studio");
  });
});
