import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildInviteUrl,
  generateInviteToken,
  hashInviteToken,
  isPlausibleInviteToken,
} from "./onboarding-token";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("generateInviteToken", () => {
  it("produces a URL-safe base64url token of plausible length", () => {
    const token = generateInviteToken();
    // 32 random bytes in base64url is 43 chars (no padding).
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces unique tokens across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(generateInviteToken());
    expect(seen.size).toBe(50);
  });
});

describe("hashInviteToken", () => {
  it("returns a 64-char lowercase hex sha256", () => {
    const hash = hashInviteToken("abc");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input (no pepper)", () => {
    delete process.env.ONBOARDING_TOKEN_HASH_PEPPER;
    expect(hashInviteToken("same")).toBe(hashInviteToken("same"));
  });

  it("changes when a pepper is applied", () => {
    const noPepper = hashInviteToken("token");
    const withPepper = hashInviteToken("token", "pepper-1");
    const otherPepper = hashInviteToken("token", "pepper-2");
    expect(withPepper).not.toBe(noPepper);
    expect(withPepper).not.toBe(otherPepper);
  });

  it("reads pepper from env when not passed explicitly", () => {
    process.env.ONBOARDING_TOKEN_HASH_PEPPER = "env-pepper";
    const fromEnv = hashInviteToken("t");
    const explicit = hashInviteToken("t", "env-pepper");
    expect(fromEnv).toBe(explicit);
  });
});

describe("isPlausibleInviteToken", () => {
  it("accepts base64url tokens in the expected length range", () => {
    expect(isPlausibleInviteToken(generateInviteToken())).toBe(true);
    expect(isPlausibleInviteToken("a".repeat(32))).toBe(true);
  });

  it("rejects tokens with invalid characters or lengths", () => {
    expect(isPlausibleInviteToken("")).toBe(false);
    expect(isPlausibleInviteToken("short")).toBe(false);
    expect(isPlausibleInviteToken("a".repeat(500))).toBe(false);
    expect(isPlausibleInviteToken("has spaces inside token here xxxxx")).toBe(
      false,
    );
    expect(isPlausibleInviteToken("has+plus=padding/slash" + "x".repeat(20))).toBe(
      false,
    );
  });

  it("rejects non-string input", () => {
    expect(isPlausibleInviteToken(123 as unknown as string)).toBe(false);
    expect(isPlausibleInviteToken(null as unknown as string)).toBe(false);
  });
});

describe("buildInviteUrl", () => {
  it("builds `${base}/client-access/<token>` from an explicit base", () => {
    expect(buildInviteUrl("abc123", "https://example.com")).toBe(
      "https://example.com/client-access/abc123",
    );
  });

  it("strips a trailing slash from the base", () => {
    expect(buildInviteUrl("abc", "https://example.com/")).toBe(
      "https://example.com/client-access/abc",
    );
  });

  it("falls back to env-derived base when no base provided", () => {
    process.env.ONBOARDING_PUBLIC_BASE_URL = "https://onb.example";
    expect(buildInviteUrl("abc")).toBe(
      "https://onb.example/client-access/abc",
    );
  });

  it("falls back to BOOKING_PUBLIC_BASE_URL then to localhost", () => {
    delete process.env.ONBOARDING_PUBLIC_BASE_URL;
    delete process.env.VERCEL_URL;
    process.env.BOOKING_PUBLIC_BASE_URL = "https://book.example";
    expect(buildInviteUrl("abc")).toBe(
      "https://book.example/client-access/abc",
    );

    delete process.env.BOOKING_PUBLIC_BASE_URL;
    expect(buildInviteUrl("abc")).toBe(
      "http://localhost:3000/client-access/abc",
    );
  });
});
