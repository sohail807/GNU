import { cookies } from "next/headers";

const COOKIE_NAME = "ist_health_session";

export interface SessionData {
  username: string;
  userId: number;
  sessionToken: string;
  role: string;
  name: string;
  tenantId?: string;
  healthprofId?: number;
  groups?: number[];
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const raw = Buffer.from(decodeURIComponent(sessionCookie.value), "base64").toString("utf-8");
    return JSON.parse(raw) as SessionData;
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
  cookieStore.delete(COOKIE_NAME);
}
