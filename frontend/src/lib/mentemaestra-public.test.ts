import { describe, expect, it } from "vitest";

import {
  MENTEMAESTRA_STUDIO_HOSTNAME,
  MENTEMAESTRA_STUDIO_ORIGIN,
  rewriteLegacyMentemaestraHost,
} from "./mentemaestra-public";

describe("rewriteLegacyMentemaestraHost", () => {
  it("rewrites mentemaestra.space to mentemaestra.studio (case-insensitive)", () => {
    expect(rewriteLegacyMentemaestraHost("https://mentemaestra.space/path")).toBe(
      "https://mentemaestra.studio/path",
    );
    expect(rewriteLegacyMentemaestraHost("https://WWW.MENTEMAESTRA.SPACE")).toBe(
      "https://WWW.mentemaestra.studio",
    );
  });

  it("rewrites support addresses", () => {
    expect(rewriteLegacyMentemaestraHost("hola@mentemaestra.space")).toBe(
      "hola@mentemaestra.studio",
    );
  });

  it("leaves .studio and unrelated hosts unchanged", () => {
    expect(rewriteLegacyMentemaestraHost("https://mentemaestra.studio/x")).toBe(
      "https://mentemaestra.studio/x",
    );
    expect(rewriteLegacyMentemaestraHost("https://example.com")).toBe(
      "https://example.com",
    );
  });
});

describe("constants", () => {
  it("uses mentemaestra.studio", () => {
    expect(MENTEMAESTRA_STUDIO_ORIGIN).toBe("https://mentemaestra.studio");
    expect(MENTEMAESTRA_STUDIO_HOSTNAME).toBe("mentemaestra.studio");
  });
});
