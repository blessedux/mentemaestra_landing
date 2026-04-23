/**
 * In-memory sliding-window rate limiter for the public client-access POST.
 *
 * Caveat: Next.js serverless functions do not share memory across invocations,
 * so under Vercel each cold start starts with an empty map. Treat this as a
 * "blunt trivial abuse" layer only; swap for Upstash / Vercel KV when you need
 * real limits. See docs/client-access-onboarding-crm.md §3.
 */

type Bucket = number[];
const buckets = new Map<string, Bucket>();

export const PUBLIC_POST_LIMIT = 5;
export const PUBLIC_POST_WINDOW_MS = 60_000;

export function takeToken(
  key: string,
  now: number = Date.now(),
  limit: number = PUBLIC_POST_LIMIT,
  windowMs: number = PUBLIC_POST_WINDOW_MS,
): { allowed: boolean; retryAfterSeconds: number } {
  const cutoff = now - windowMs;
  const prev = buckets.get(key) ?? [];
  const recent = prev.filter((t) => t > cutoff);
  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    buckets.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIpFromHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

/** Test helper — do not call in production paths. */
export function __resetRateLimit(): void {
  buckets.clear();
}
