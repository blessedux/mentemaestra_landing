import { afterEach, describe, expect, it } from "vitest";

import { getPublicSiteUrl } from "./public-site-url";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getPublicSiteUrl", () => {
  it("uses mentemaestra.studio on Vercel production when BOOKING_PUBLIC_BASE_URL is unset", () => {
    delete process.env.BOOKING_PUBLIC_BASE_URL;
    process.env.VERCEL_URL = "app-abc123.vercel.app";
    process.env.VERCEL_ENV = "production";
    expect(getPublicSiteUrl()).toBe("https://mentemaestra.studio");
  });

  it("uses VERCEL_URL on Vercel preview when BOOKING_PUBLIC_BASE_URL is unset", () => {
    delete process.env.BOOKING_PUBLIC_BASE_URL;
    process.env.VERCEL_URL = "app-git-feat-abc.vercel.app";
    process.env.VERCEL_ENV = "preview";
    expect(getPublicSiteUrl()).toBe("https://app-git-feat-abc.vercel.app");
  });

  it("rewrites legacy mentemaestra.space in BOOKING_PUBLIC_BASE_URL", () => {
    process.env.BOOKING_PUBLIC_BASE_URL = "https://mentemaestra.space/";
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_ENV;
    expect(getPublicSiteUrl()).toBe("https://mentemaestra.studio");
  });
});
