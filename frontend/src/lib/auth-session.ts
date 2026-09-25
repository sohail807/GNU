import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

const COOKIE_NAME = "ist_health_session";
const REVOCATION_DIR = process.env.RESET_TOKEN_DIR || path.join(process.cwd(), ".tokens");
const REVOCATION_FILE = path.join(REVOCATION_DIR, "revoked_sessions.json");

function ensureDirectory() {
  if (!fs.existsSync(REVOCATION_DIR)) {
    fs.mkdirSync(REVOCATION_DIR, { recursive: true });
  }
}

function loadRevocations(): Record<string, number> {
  try {
    ensureDirectory();
    if (!fs.existsSync(REVOCATION_FILE)) return {};
    const data = fs.readFileSync(REVOCATION_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveRevocations(store: Record<string, number>): void {
  try {
    ensureDirectory();
    const tempFile = `${REVOCATION_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), "utf-8");
    fs.renameSync(tempFile, REVOCATION_FILE);
  } catch (err) {
    console.error("Failed to save revoked sessions:", err);
  }
}

export function revokeSession(sessionToken: string): void {
  if (!sessionToken) return;
  const store = loadRevocations();
  store[sessionToken] = Date.now();
  saveRevocations(store);
}

export function isSessionRevoked(sessionToken: string): boolean {
  if (!sessionToken) return true;
  const store = loadRevocations();
  return !!store[sessionToken];
}

export interface SessionData {
  username: string;
  userId: number;
  sessionToken: string;
  role: string;
  name: string;
  tenantId?: string;
  database?: string;
  companyId?: number;
  healthprofId?: number;
  groups?: number[];
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const raw = Buffer.from(decodeURIComponent(sessionCookie.value), "base64").toString("utf-8");
    const data = JSON.parse(raw) as SessionData;

    // Check if session token has been revoked
    if (isSessionRevoked(data.sessionToken)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(data), "utf-8").toString("base64");

  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (sessionCookie?.value) {
    try {
      const raw = Buffer.from(decodeURIComponent(sessionCookie.value), "base64").toString("utf-8");
      const data = JSON.parse(raw) as SessionData;
      if (data.sessionToken) {
        revokeSession(data.sessionToken);
      }
    } catch {
      // Continue to delete cookie
    }
  }
  cookieStore.delete(COOKIE_NAME);
}
