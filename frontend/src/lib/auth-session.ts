import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

const COOKIE_NAME = "ist_health_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const REVOCATION_DIR = process.env.SESSION_REVOCATION_DIR || path.join(process.cwd(), ".tokens");
const REVOCATION_FILE = path.join(REVOCATION_DIR, "revoked_sessions.json");

function encryptionKey(): Buffer {
  const secret = process.env.SESSION_ENCRYPTION_KEY;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_ENCRYPTION_KEY must be configured with at least 32 bytes.");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

function tokenDigest(sessionToken: string): string {
  return createHash("sha256").update(sessionToken, "utf8").digest("hex");
}

function loadRevocations(): Record<string, number> {
  try {
    if (!fs.existsSync(REVOCATION_FILE)) return {};
    const value: unknown = JSON.parse(fs.readFileSync(REVOCATION_FILE, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, number>;
  } catch {
    return {};
  }
}

function isRevoked(sessionToken: string): boolean {
  return Boolean(loadRevocations()[tokenDigest(sessionToken)]);
}

function revoke(sessionToken: string): void {
  if (!sessionToken) return;
  const now = Date.now();
  const records = loadRevocations();
  for (const [digest, revokedAt] of Object.entries(records)) {
    if (now - revokedAt > SESSION_TTL_SECONDS * 1000) delete records[digest];
  }
  records[tokenDigest(sessionToken)] = now;
  fs.mkdirSync(REVOCATION_DIR, { recursive: true });
  const tempFile = `${REVOCATION_FILE}.${randomBytes(6).toString("hex")}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(records), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(tempFile, REVOCATION_FILE);
}

function encryptSession(data: SessionData): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decryptSession(value: string): SessionData {
  const [ivPart, tagPart, ciphertextPart, extra] = value.split(".");
  if (!ivPart || !tagPart || !ciphertextPart || extra) {
    throw new Error("Invalid session cookie.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const data = JSON.parse(plaintext) as SessionData;
  if (!data.username || !Number.isInteger(data.userId) || !data.sessionToken) {
    throw new Error("Invalid session data.");
  }
  if (!Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) {
    throw new Error("Session expired.");
  }
  return data;
}

export interface SessionData {
  username: string;
  userId: number;
  sessionToken: string;
  role: string;
  name: string;
  tenantId: string;
  database: string;
  companyId: number;
  healthprofId?: number;
  groups: number[];
  expiresAt: number;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    const data = decryptSession(sessionCookie.value);
    if (isRevoked(data.sessionToken)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setSession(data: Omit<SessionData, "expiresAt">): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const value = encryptSession({ ...data, expiresAt });
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (sessionCookie?.value) {
    try {
      const data = decryptSession(sessionCookie.value);
      revoke(data.sessionToken);
    } catch {
      // Delete invalid or expired cookies even if they cannot be revoked.
    }
  }
  cookieStore.delete(COOKIE_NAME);
}
