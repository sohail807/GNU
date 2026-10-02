/**
 * Failed-login throttle. In-memory and per instance: behind Firebase Hosting / Cloud Run the
 * VM's nginx limit_req no longer sees real client traffic, so the app enforces its own limit.
 * Keyed by username AND client IP so a rotating IP can't brute-force one account and one
 * noisy IP can't lock everyone out.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_USER = 8;
const MAX_FAILURES_PER_IP = 30;
const MAX_TRACKED_KEYS = 10_000;

const failures = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
  const hits = (failures.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length) failures.set(key, hits);
  else failures.delete(key);
  return hits;
}

export function clientIp(headers: Headers): string {
  // Firebase Hosting (Fastly) sets fastly-client-ip; fall back to the first x-forwarded-for hop.
  return (
    headers.get("fastly-client-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Seconds until the caller may retry, or 0 when not limited. */
export function loginRetryAfter(username: string, ip: string): number {
  const now = Date.now();
  const limits: Array<[string, number]> = [
    [`u:${username.toLowerCase()}`, MAX_FAILURES_PER_USER],
    [`i:${ip}`, MAX_FAILURES_PER_IP],
  ];
  let wait = 0;
  for (const [key, max] of limits) {
    const hits = recent(key, now);
    if (hits.length >= max) {
      wait = Math.max(wait, Math.ceil((hits[0] + WINDOW_MS - now) / 1000));
    }
  }
  return wait;
}

export function recordLoginFailure(username: string, ip: string): void {
  const now = Date.now();
  if (failures.size > MAX_TRACKED_KEYS) failures.clear();
  for (const key of [`u:${username.toLowerCase()}`, `i:${ip}`]) {
    failures.set(key, [...recent(key, now), now]);
  }
}

export function clearLoginFailures(username: string): void {
  failures.delete(`u:${username.toLowerCase()}`);
}
