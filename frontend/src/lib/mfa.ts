import crypto from "crypto";

/**
 * Enterprise Multi-Factor Authentication (MFA) Service
 * 
 * Implements RFC 6238 Time-Based One-Time Password (TOTP)
 * for privileged healthcare accounts (Hospital Administrators, Super-Admins).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

export function computeTotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, "0");
}

export function verifyTotpToken(
  secret: string,
  token: string,
  window: number = 1,
  timeStep: number = 30
): boolean {
  if (!token || token.length !== 6) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const expected = computeTotp(secret, currentCounter + i);
    if (expected === token) {
      return true;
    }
  }

  return false;
}

export function isPrivilegedAccount(username: string, role?: string): boolean {
  const lowerUser = username.toLowerCase();
  if (lowerUser === "admin" || lowerUser === "demo_admin1") return true;
  if (role === "admin") return true;
  return false;
}
