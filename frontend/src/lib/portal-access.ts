import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

/**
 * Stateless portal auth for the client-facing dashboard.
 *
 * Each allowlisted email gets an HMAC-signed URL in their welcome email
 * (`/client/<slug>/enter?token=<signed>`). Clicking it drops a signed
 * session cookie and drops the user into the portal. The cookie is still
 * cross-checked against the live allowlist on every page load, so removing
 * someone from `onboarding_submissions.stakeholders` immediately locks them
 * out even while their old cookie is still technically valid.
 *
 * No Supabase Auth, no OTP round-trips, no second email — the single welcome
 * email is all the recipient needs to get in.
 *
 * Rotate `PORTAL_SESSION_SECRET` to invalidate every outstanding link.
 */

const COOKIE_NAME = "mm_portal_session";
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // welcome-link validity: 90d
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // cookie validity: 30d

/**
 * Optional cookie domain (e.g. ".mentemaestra.studio") so the session survives
 * apex ↔ www ↔ other subdomain hops in production.
 *
 * Leave unset for localhost / preview deployments.
 */
export function portalSessionCookieDomain(): string | undefined {
  const raw = process.env.PORTAL_SESSION_COOKIE_DOMAIN?.trim();
  if (!raw) return undefined;
  return raw;
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(): string {
  const raw = process.env.PORTAL_SESSION_SECRET?.trim();
  if (!raw || raw.length < 32) {
    throw new Error(
      "PORTAL_SESSION_SECRET must be set to at least 32 characters. " +
        "Generate with: openssl rand -hex 32",
    );
  }
  return raw;
}

function sign(payload: string): string {
  return base64urlEncode(
    createHmac("sha256", getSecret()).update(payload).digest(),
  );
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Access tokens (embedded in welcome email links)
// ---------------------------------------------------------------------------

export type AccessTokenClaims = {
  slug: string;
  email: string;
  iat: number;
};

export function signAccessToken(input: {
  slug: string;
  email: string;
}): string {
  const claims: AccessTokenClaims = {
    slug: input.slug.toLowerCase(),
    email: input.email.toLowerCase(),
    iat: Math.floor(Date.now() / 1000),
  };
  const payload = base64urlEncode(Buffer.from(JSON.stringify(claims), "utf8"));
  return `${payload}.${sign(payload)}`;
}

export function verifyAccessToken(token: string): AccessTokenClaims | null {
  const idx = token.indexOf(".");
  if (idx <= 0 || idx === token.length - 1) return null;
  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  if (!safeEqual(sign(payload), signature)) return null;
  try {
    const decoded = JSON.parse(base64urlDecode(payload).toString("utf8"));
    if (
      !decoded ||
      typeof decoded.slug !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.iat !== "number"
    ) {
      return null;
    }
    const age = Math.floor(Date.now() / 1000) - decoded.iat;
    if (age < 0 || age > ACCESS_MAX_AGE_SECONDS) return null;
    return {
      slug: decoded.slug.toLowerCase(),
      email: decoded.email.toLowerCase(),
      iat: decoded.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Build the absolute URL we embed in welcome emails. The recipient clicks
 * this once and is dropped into the portal.
 */
export function buildPortalAccessUrl(
  baseUrl: string,
  slug: string,
  email: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const token = signAccessToken({ slug, email });
  return `${base}/client/${encodeURIComponent(slug.toLowerCase())}/enter?token=${encodeURIComponent(token)}`;
}

// ---------------------------------------------------------------------------
// Session cookie (set after a successful access-token redemption)
// ---------------------------------------------------------------------------

export type PortalSession = {
  slug: string;
  email: string;
  exp: number;
  /** Internal operator session (minted via /api/internal/*). Bypasses allowlist checks. */
  admin?: boolean;
};

function signSessionValue(sess: PortalSession): string {
  const payload = base64urlEncode(Buffer.from(JSON.stringify(sess), "utf8"));
  return `${payload}.${sign(payload)}`;
}

function parseSessionValue(raw: string): PortalSession | null {
  const idx = raw.indexOf(".");
  if (idx <= 0 || idx === raw.length - 1) return null;
  const payload = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  if (!safeEqual(sign(payload), signature)) return null;
  try {
    const decoded = JSON.parse(base64urlDecode(payload).toString("utf8"));
    if (
      !decoded ||
      typeof decoded.slug !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }
    if (typeof decoded.admin !== "undefined" && typeof decoded.admin !== "boolean") {
      return null;
    }
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      slug: decoded.slug.toLowerCase(),
      email: decoded.email.toLowerCase(),
      exp: decoded.exp,
      admin: decoded.admin === true ? true : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Whether the portal session cookie should use the `Secure` flag.
 * Default: secure in production. Override with `PORTAL_SESSION_COOKIE_SECURE=true|false`
 * (e.g. `false` for local HTTPS testing, or `true` behind a proxy when NODE_ENV is not production).
 */
export function portalSessionCookieSecure(): boolean {
  const raw = process.env.PORTAL_SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return process.env.NODE_ENV === "production";
}

function buildPortalSessionCookieValue(
  slug: string,
  email: string,
  opts: { admin?: boolean } = {},
): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    domain?: string;
    path: string;
    maxAge: number;
    expires: Date;
  };
} {
  const now = Math.floor(Date.now() / 1000);
  const sess: PortalSession = {
    slug: slug.toLowerCase(),
    email: email.toLowerCase(),
    exp: now + SESSION_MAX_AGE_SECONDS,
    admin: opts.admin === true ? true : undefined,
  };
  return {
    name: COOKIE_NAME,
    value: signSessionValue(sess),
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: portalSessionCookieSecure(),
      domain: portalSessionCookieDomain(),
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      // Some browsers are pickier about persistence when only `maxAge` is set.
      // We set both to maximize long-lived session behavior.
      expires: new Date((now + SESSION_MAX_AGE_SECONDS) * 1000),
    },
  };
}

/**
 * Attach the portal session cookie to a `NextResponse` (redirect, JSON, etc.).
 * **Prefer this in Route Handlers** so `Set-Cookie` is definitely on the outgoing
 * response; `cookies().set()` alone can fail to merge with `NextResponse.redirect()`.
 */
export function applyPortalSessionCookie(
  res: NextResponse,
  slug: string,
  email: string,
): void {
  const { name, value, options } = buildPortalSessionCookieValue(slug, email);
  res.cookies.set(name, value, options);
}

export function getPortalAdminEmail(): string {
  return (process.env.PORTAL_ADMIN_EMAIL?.trim() || "admin@mentemaestra.studio").toLowerCase();
}

/** Internal-only: mint a session that bypasses allowlist checks. */
export function applyAdminPortalSessionCookie(
  res: NextResponse,
  slug: string,
): void {
  const { name, value, options } = buildPortalSessionCookieValue(
    slug,
    getPortalAdminEmail(),
    { admin: true },
  );
  res.cookies.set(name, value, options);
}

/** Clear the portal cookie on a `NextResponse` (e.g. logout `204`). */
export function applyClearPortalSessionCookie(res: NextResponse): void {
  const secure = portalSessionCookieSecure();
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    domain: portalSessionCookieDomain(),
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Mint + set the HttpOnly session cookie via `cookies()` (e.g. Server Actions).
 * Route Handlers that return `NextResponse` should use `applyPortalSessionCookie` instead.
 */
export async function setPortalSessionCookie(
  slug: string,
  email: string,
): Promise<void> {
  const store = await cookies();
  const { name, value, options } = buildPortalSessionCookieValue(slug, email);
  store.set(name, value, options);
}

/** Read + validate the session cookie. Safe to call from RSCs. */
export async function readPortalSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return parseSessionValue(raw);
}

export async function clearPortalSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
