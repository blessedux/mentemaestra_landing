import { createHash, randomBytes } from "crypto";

import {
  getOnboardingPublicBaseUrl,
  getOnboardingTokenPepper,
} from "@/lib/onboarding-env";

/** 32 random bytes encoded as base64url — URL-safe, no padding. */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * `sha256(token [+ pepper])` as lowercase hex (64 chars).
 * The pepper is optional; if unset this still hashes the token so DB rows
 * never store the raw invite string.
 */
export function hashInviteToken(rawToken: string, pepper?: string): string {
  const mix = pepper ?? getOnboardingTokenPepper();
  return createHash("sha256").update(`${rawToken}${mix}`).digest("hex");
}

/** Base64url tokens only use `A-Z a-z 0-9 _ -`. */
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

/** Cheap shape check before touching the DB. */
export function isPlausibleInviteToken(raw: string): boolean {
  if (typeof raw !== "string") return false;
  if (raw.length < 32 || raw.length > 128) return false;
  return BASE64URL_RE.test(raw);
}

/** `${base}/client-access/<token>` — no trailing slash on base. */
export function buildInviteUrl(token: string, baseUrl?: string): string {
  const base = (baseUrl ?? getOnboardingPublicBaseUrl()).replace(/\/$/, "");
  return `${base}/client-access/${encodeURIComponent(token)}`;
}
