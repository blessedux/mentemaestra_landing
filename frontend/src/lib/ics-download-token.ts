import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string | null {
  const s = process.env.BOOKING_ICS_DOWNLOAD_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

export function canSignIcsDownloadLinks(): boolean {
  return Boolean(getSecret());
}

export function signIcsDownloadToken(bookingId: string, expUnix: number): string {
  const secret = getSecret();
  if (!secret) throw new Error("BOOKING_ICS_DOWNLOAD_SECRET not configured");
  return createHmac("sha256", secret)
    .update(`${bookingId}|${expUnix}`)
    .digest("hex");
}

export function verifyIcsDownloadToken(
  bookingId: string,
  expUnix: number,
  sigHex: string,
): boolean {
  const secret = getSecret();
  if (!secret) return false;
  if (!/^[0-9a-f]{64}$/i.test(sigHex)) return false;
  const expected = createHmac("sha256", secret)
    .update(`${bookingId}|${expUnix}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function icsDownloadExpirySeconds(): number {
  return 60 * 60 * 24 * 14;
}
