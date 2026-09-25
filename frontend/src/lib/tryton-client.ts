/**
 * IST Health — Native Tryton JSON-RPC 2.0 Integration Client
 * Directly interfaces with the authoritative GNU Health backend.
 * Strictly enforces session token headers and mandatory company context.
 */

const TRYTON_BASE_URL = process.env.GNUHEALTH_BACKEND_URL || "http://34.7.237.8/gnuhealth/";
const ADMIN_PASSWORD = process.env.GNUHEALTH_ADMIN_PASSWORD || "Admin12345!";

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
    const defaultUrl = process.env.GNUHEALTH_BACKEND_URL;
    if (defaultUrl && !database) {
      return defaultUrl.endsWith("/") ? defaultUrl : `${defaultUrl}/`;
    }
    const rawHost = process.env.GNUHEALTH_HOST || "http://34.7.237.8";
    const host = rawHost.replace(/\/+$/, "");
    const dbName = database || process.env.GNUHEALTH_DATABASE || "gnuhealth";
    return `${host}/${dbName}/`;
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

    const fullContext = {
      company: context.company || 2,
      language: "en",
      ...context,
    };

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

  private static systemSession: { username: string; userId: number; token: string; expiresAt: number } | null = null;

  /**
   * Executes a system-level administrative call (strictly for automated background services or bootstrap)
   */
  static async executeSystem<T = unknown>(
    model: string,
    method: string,
    params: unknown[] = [],
    context: Record<string, unknown> = {},
    database?: string
  ): Promise<T> {
    const now = Date.now();
    if (!this.systemSession || now > this.systemSession.expiresAt) {
      try {
        const loginRes = await this.login("demo_admin1", "DemoAdmin2026!", database);
        this.systemSession = {
          username: "demo_admin1",
          userId: loginRes.userId,
          token: loginRes.sessionToken,
          expiresAt: now + 1000 * 60 * 30, // 30 minutes
        };
      } catch {
        const loginRes = await this.login("admin", ADMIN_PASSWORD, database);
        this.systemSession = {
          username: "admin",
          userId: loginRes.userId,
          token: loginRes.sessionToken,
          expiresAt: now + 1000 * 60 * 30,
        };
      }
    }

    try {
      return await this.execute<T>(
        this.systemSession.username,
        this.systemSession.userId,
        this.systemSession.token,
        model,
        method,
        params,
        context,
        database
      );
    } catch {
      // Invalidate cache and retry once
      this.systemSession = null;
      let loginRes;
      let user = "demo_admin1";
      try {
        loginRes = await this.login("demo_admin1", "DemoAdmin2026!", database);
      } catch {
        user = "admin";
        loginRes = await this.login("admin", ADMIN_PASSWORD, database);
      }
      this.systemSession = {
        username: user,
        userId: loginRes.userId,
        token: loginRes.sessionToken,
        expiresAt: Date.now() + 1000 * 60 * 30,
      };
      return await this.execute<T>(
        this.systemSession.username,
        this.systemSession.userId,
        this.systemSession.token,
        model,
        method,
        params,
        context,
        database
      );
    }
  }
}
