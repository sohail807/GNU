/**
 * IST Health — Native Tryton JSON-RPC 2.0 Integration Client
 * Directly interfaces with the authoritative GNU Health backend.
 * Strictly enforces session token headers and mandatory company context.
 */

const RPC_TIMEOUT_MS = 15_000;

export interface TrytonLoginResult {
  userId: number;
  sessionToken: string;
}

export interface TrytonRPCError {
  code: number | string;
  message: string;
  data?: unknown;
}

export class TrytonClient {
  private static encodeBase64(str: string): string {
    return Buffer.from(str, "utf-8").toString("base64");
  }

  /**
   * Resolves the target Tryton backend endpoint dynamically for a specific tenant database.
   */
  static getBaseUrl(database?: string): string {
    const rawHost = process.env.GNUHEALTH_HOST;
    if (!rawHost) throw new Error("GNUHEALTH_HOST is required.");
    const host = new URL(rawHost);
    if (host.username || host.password || host.search || host.hash) {
      throw new Error("GNUHEALTH_HOST must not contain credentials, query parameters, or fragments.");
    }
    const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(host.hostname.replace(/^\[|\]$/g, ""));
    if (process.env.NODE_ENV === "production" && host.protocol !== "https:" && !(host.protocol === "http:" && isLoopback)) {
      throw new Error("GNU Health backend connections must use HTTPS in production, except for a loopback-only backend connection.");
    }
    if (host.protocol !== "https:" && host.protocol !== "http:") {
      throw new Error("GNUHEALTH_HOST must use HTTP or HTTPS.");
    }
    const dbName = database || process.env.GNUHEALTH_DATABASE;
    if (!dbName || !/^[A-Za-z0-9_-]+$/.test(dbName)) {
      throw new Error("A valid GNUHEALTH_DATABASE is required.");
    }
    return new URL(`${encodeURIComponent(dbName)}/`, host.toString().replace(/\/?$/, "/")).toString();
  }

  /**
   * Performs primary authentication via common.db.login against the tenant's dedicated database
   */
  static async login(username: string, password: string, database?: string): Promise<TrytonLoginResult> {
    const authHeader = `Basic ${this.encodeBase64(`${username}:${password}`)}`;
    const payload = {
      id: Date.now(),
      method: "common.db.login",
      params: [username, { password }],
    };

    const targetUrl = this.getBaseUrl(database);
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Authentication failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`Tryton login error: ${JSON.stringify(data.error)}`);
    }

    const [userId, sessionToken] = data.result !== undefined ? data.result : data;
    if (!userId || !sessionToken) {
      throw new Error("Invalid response received from common.db.login");
    }

    return { userId, sessionToken };
  }

  static async logout(
    username: string,
    userId: number,
    sessionToken: string,
    database?: string
  ): Promise<void> {
    const res = await fetch(this.getBaseUrl(database), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Session ${this.encodeBase64(`${username}:${userId}:${sessionToken}`)}`,
      },
      body: JSON.stringify({ id: Date.now(), method: "common.db.logout", params: [] }),
      cache: "no-store",
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Tryton logout failed (${res.status}).`);
    const data = await res.json();
    if (data.error) throw new Error("Tryton rejected the logout request.");
  }

  /**
   * Executes an authenticated model method via JSON-RPC 2.0 against the tenant's dedicated database
   */
  static async execute<T = unknown>(
    username: string,
    userId: number,
    sessionToken: string,
    model: string,
    method: string,
    params: unknown[] = [],
    context: Record<string, unknown> = {},
    database?: string
  ): Promise<T> {
    const sessionAuth = `Session ${this.encodeBase64(`${username}:${userId}:${sessionToken}`)}`;

    const fullContext = { language: "en", ...context };

    // Tryton model calls expect context as the final parameter
    const callParams = [...params, fullContext];

    const payload = {
      id: Date.now(),
      method: `model.${model}.${method}`,
      params: callParams,
    };

    const targetUrl = this.getBaseUrl(database);
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: sessionAuth,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 400 && errText.includes("not allowed to access")) {
        const error = new Error(`Access Denied: You do not have permission to access ${model}.`);
        (error as any).status = 403;
        throw error;
      }
      const error = new Error(`Tryton RPC failed (${res.status}) on ${model}.${method}: ${errText}`);
      (error as any).status = res.status;
      throw error;
    }

    const data = await res.json();
    if (data.error) {
      const errStr = JSON.stringify(data.error);
      if (errStr.includes("not allowed to access") || errStr.includes("AccessError")) {
        const error = new Error(`Access Denied: Security rules prevent access to ${model}.`);
        (error as any).status = 403;
        throw error;
      }
      if (errStr.includes("unique") || errStr.includes("duplicate key") || errStr.includes("IntegrityError")) {
        const error = new Error(`Data Integrity Error: Duplicate record or constraint violation on ${model}.`);
        (error as any).status = 409;
        throw error;
      }
      throw new Error(`Tryton RPC error on ${model}.${method}: ${errStr}`);
    }

    return (data.result !== undefined ? data.result : data) as T;
  }

}
