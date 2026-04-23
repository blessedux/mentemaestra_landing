/** Same as `normalizeBrowserHostInOrigin` but for a bare `protocol//host:port` origin string only. */
export function normalizeBrowserHostForOriginOnly(origin: string): string {
  let u: URL;
  try {
    u = new URL(origin);
  } catch {
    return origin;
  }
  if (u.hostname === "0.0.0.0" || u.hostname === "[::]" || u.hostname === "::") {
    u.hostname = "localhost";
  }
  return u.origin;
}

/**
 * `0.0.0.0` / `[::]` are bind addresses, not stable document origins: cookies and
 * redirects behave badly compared to `localhost`. Normalize for URLs we emit.
 */
export function normalizeBrowserHostInOrigin(input: string): string {
  const noTrail = input.replace(/\/$/, "");
  let u: URL;
  try {
    u = new URL(noTrail.includes("://") ? noTrail : `https://${noTrail}`);
  } catch {
    return noTrail;
  }
  if (u.hostname === "0.0.0.0" || u.hostname === "[::]" || u.hostname === "::") {
    u.hostname = "localhost";
  }
  let path = u.pathname;
  if (path.endsWith("/") && path.length > 1) path = path.slice(0, -1);
  const withPath = `${u.origin}${path === "/" ? "" : path}${u.search}`;
  return withPath.replace(/\/$/, "");
}

/**
 * Origin for redirects from this request: honors reverse-proxy headers, then
 * normalizes `0.0.0.0` → `localhost` so session cookies apply on the follow-up GET.
 */
export function canonicalOriginFromRequest(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0].trim();
    const proto = forwardedProto || "https";
    return normalizeBrowserHostForOriginOnly(`${proto}://${host}`);
  }
  try {
    return normalizeBrowserHostForOriginOnly(new URL(req.url).origin);
  } catch {
    return "http://localhost:3000";
  }
}

/** Canonical site URL for links inside emails and ICS download (no trailing slash). */
export function getPublicSiteUrl(): string {
  const raw = process.env.BOOKING_PUBLIC_BASE_URL?.trim();
  let base: string;
  if (raw) base = raw.replace(/\/$/, "");
  else {
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) base = `https://${vercel.replace(/\/$/, "")}`;
    else base = "http://localhost:3000";
  }
  return normalizeBrowserHostInOrigin(base);
}

export function getSocialUrlsForEmail(): {
  instagram: string;
  behance: string;
  linkedin: string;
  web: string;
} {
  const base = getPublicSiteUrl();
  return {
    instagram: process.env.BOOKING_SOCIAL_INSTAGRAM_URL?.trim() || base,
    behance: process.env.BOOKING_SOCIAL_BEHANCE_URL?.trim() || base,
    linkedin: process.env.BOOKING_SOCIAL_LINKEDIN_URL?.trim() || base,
    web: process.env.BOOKING_SOCIAL_WEB_URL?.trim() || base,
  };
}
