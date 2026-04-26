import "server-only";

/**
 * AES-256-GCM symmetric encryption for GSC refresh tokens.
 *
 * Key setup (one-time):
 *   openssl rand -hex 32
 * Store the 64-char hex string in GSC_TOKEN_ENCRYPTION_KEY.
 *
 * Each call to encrypt() produces a fresh random IV, so every
 * ciphertext is unique even for the same plaintext.
 */

function getKey(): string {
  const k = process.env.GSC_TOKEN_ENCRYPTION_KEY?.trim() ?? "";
  if (!k) {
    throw new Error(
      "GSC_TOKEN_ENCRYPTION_KEY is not set. " +
        "Generate one with: openssl rand -hex 32",
    );
  }
  return k;
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

function bytesToBase64(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64");
}

function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function importKey(hex: string): Promise<CryptoKey> {
  const raw = hexToBytes(hex);
  return crypto.subtle.importKey("raw", raw.buffer as ArrayBuffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Returns a base64 string of the format `<iv_b64>.<ciphertext_b64>`.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await importKey(getKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded.buffer as ArrayBuffer,
  );
  return `${bytesToBase64(iv.buffer as ArrayBuffer)}.${bytesToBase64(ciphertext)}`;
}

/**
 * Decrypts a value previously produced by encryptToken().
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const [ivB64, ctB64] = encrypted.split(".");
  if (!ivB64 || !ctB64) throw new Error("Invalid encrypted token format");
  const key = await importKey(getKey());
  const iv = base64ToBytes(ivB64);
  const ct = base64ToBytes(ctB64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ct.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plain);
}

/** Returns true if the encryption key env var is configured. */
export function hasEncryptionKey(): boolean {
  return Boolean(process.env.GSC_TOKEN_ENCRYPTION_KEY?.trim());
}
