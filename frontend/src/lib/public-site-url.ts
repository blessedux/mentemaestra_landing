/** Canonical site URL for links inside emails and ICS download (no trailing slash). */
export function getPublicSiteUrl(): string {
  const raw = process.env.BOOKING_PUBLIC_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
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
