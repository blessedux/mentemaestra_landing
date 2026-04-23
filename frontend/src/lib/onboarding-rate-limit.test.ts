import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetRateLimit,
  clientIpFromHeaders,
  takeToken,
} from "./onboarding-rate-limit";

beforeEach(() => {
  __resetRateLimit();
});

describe("takeToken", () => {
  const KEY = "test-key";

  it("allows requests up to the limit inside a window", () => {
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      expect(takeToken(KEY, now + i).allowed).toBe(true);
    }
    const blocked = takeToken(KEY, now + 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("recovers after the window slides past", () => {
    const now = 2_000_000_000_000;
    for (let i = 0; i < 5; i++) takeToken(KEY, now + i);
    expect(takeToken(KEY, now + 10).allowed).toBe(false);
    const later = takeToken(KEY, now + 61_000);
    expect(later.allowed).toBe(true);
  });

  it("keys are independent", () => {
    const now = 3_000_000_000_000;
    for (let i = 0; i < 5; i++) takeToken("a", now);
    expect(takeToken("a", now).allowed).toBe(false);
    expect(takeToken("b", now).allowed).toBe(true);
  });
});

describe("clientIpFromHeaders", () => {
  it("uses the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientIpFromHeaders(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(clientIpFromHeaders(h)).toBe("9.9.9.9");
  });

  it("returns unknown when no hints are present", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
