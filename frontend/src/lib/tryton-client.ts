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

interface HttpStatusError extends Error { status?: number }

export type TrytonWorkflowWizard = "gnuhealth.lab.test.create" | "account.invoice.pay";

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
        const error = new Error(`Access Denied: You do not have permission to access ${model}.`) as HttpStatusError;
        error.status = 403;
        throw error;
      }
      const error = new Error(`Tryton RPC failed (${res.status}) on ${model}.${method}: ${errText}`) as HttpStatusError;
      error.status = res.status;
      throw error;
    }

    const data = await res.json() as { error?: unknown; result?: T };
    if (data.error) {
      const errStr = JSON.stringify(data.error);
      if (errStr.includes("not allowed to access") || errStr.includes("AccessError")) {
        const error = new Error(`Access Denied: Security rules prevent access to ${model}.`) as HttpStatusError;
        error.status = 403;
        throw error;
      }
      if (errStr.includes("unique") || errStr.includes("duplicate key") || errStr.includes("IntegrityError")) {
        const error = new Error(`Data Integrity Error: Duplicate record or constraint violation on ${model}.`) as HttpStatusError;
        error.status = 409;
        throw error;
      }
      // Tryton's model layer normally rejects a delete that would orphan a reference with its
      // own UserError before the database is even touched (verified live: deleting a
      // base-config-protected or cross-referenced record both come back as a clean UserError,
      // not a raw DB error). This is a safety net for the rare case a raw Postgres foreign-key
      // violation slips through uncaught instead.
      if (errStr.includes("violates foreign key constraint") || errStr.includes("ForeignKeyError") || errStr.includes("is still referenced")) {
        const error = new Error(`This ${model} record is still referenced elsewhere and can't be deleted.`) as HttpStatusError;
        error.status = 409;
        throw error;
      }
      // Tryton's JSON-RPC shape for a business-rule rejection is
      // [errorType, [humanMessage, description, domain]] -- e.g.
      // ["UserError", ["You can not have two users with the same login!", "", null]].
      // Extract just the human message instead of dumping the raw array to the client. This
      // covers every UserError/UserWarning/ConcurrencyException the backend can raise -- not
      // just the specific ones we've happened to hit and special-cased above -- so a new kind
      // of validation rejection (an invoice in the wrong state, a required field, a blocked
      // discharge, a name already in use, ...) reads as a normal message instead of leaking
      // raw JSON-RPC text into the UI.
      if (
        Array.isArray(data.error) &&
        typeof data.error[0] === "string" &&
        ["UserError", "UserWarning", "ConcurrencyException"].includes(data.error[0]) &&
        Array.isArray(data.error[1]) &&
        typeof data.error[1][0] === "string" &&
        data.error[1][0].trim()
      ) {
        const error = new Error(data.error[1][0]) as HttpStatusError;
        error.status = 400;
        throw error;
      }
      throw new Error(`Tryton RPC error on ${model}.${method}: ${errStr}`);
    }

    return (data.result !== undefined ? data.result : data) as T;
  }

  /**
   * Runs the GNU Health lab-result creation wizard for existing patient lab
   * request records. The wizard allowlist intentionally stays narrow: callers
   * cannot dispatch arbitrary Tryton wizards.
   */
  static async createLabResultFromRequests(
    username: string,
    userId: number,
    sessionToken: string,
    requestIds: number[],
    context: Record<string, unknown> = {},
    database?: string
  ): Promise<void> {
    if (requestIds.length < 1 || requestIds.length > 20 || requestIds.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      throw new Error("A valid set of laboratory request IDs is required.");
    }

    const wizardName: TrytonWorkflowWizard = "gnuhealth.lab.test.create";
    const auth = `Session ${this.encodeBase64(`${username}:${userId}:${sessionToken}`)}`;
    const fullContext = { language: "en", ...context, active_model: "gnuhealth.patient.lab.test", active_ids: requestIds, active_id: requestIds[0] };
    const call = async <T>(method: "create" | "execute" | "delete", params: unknown[]): Promise<T> => {
      const res = await fetch(this.getBaseUrl(database), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify({ id: Date.now(), method: `wizard.${wizardName}.${method}`, params: [...params, fullContext] }),
        cache: "no-store",
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });
      if (!res.ok) {
        const error = new Error(`Tryton wizard request failed (${res.status}).`);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
      const data = await res.json();
      if (data.error) {
        const errText = JSON.stringify(data.error);
        const status = errText.includes("AccessError") || errText.includes("not allowed to access") ? 403 : 502;
        const error = new Error(status === 403 ? "Access denied while running the laboratory workflow." : "The GNU Health rejected the laboratory workflow.");
        (error as Error & { status?: number }).status = status;
        throw error;
      }
      return (data.result !== undefined ? data.result : data) as T;
    };

    const created = await call<[number | string, string, string]>("create", []);
    const wizardSessionId = created?.[0];
    const startingState = created?.[1];
    if (!((typeof wizardSessionId === "number" && Number.isSafeInteger(wizardSessionId) && wizardSessionId > 0) || (typeof wizardSessionId === "string" && wizardSessionId.length > 0)) || startingState !== "start" || created?.[2] !== "end") {
      throw new Error("The GNU Health returned an unsupported laboratory wizard state.");
    }
    try {
      await call("execute", [wizardSessionId, {}, "create_lab_test"]);
    } finally {
      await call("delete", [wizardSessionId]).catch(() => undefined);
    }
  }

  /**
   * Runs GNU Health's real account.invoice.pay wizard for a full settlement
   * (the invoice's entire amount_to_pay, paid in one go). This is the only
   * safe automated case: the wizard's own transition_choice() takes the
   * "ask" branch (partial payment / write-off / overpayment resolution)
   * whenever the amount doesn't exactly clear the balance, and this method
   * deliberately does not attempt to guess a resolution for that - it
   * surfaces a clear error instead so a human handles the reconciliation.
   */
  static async payInvoiceFull(
    username: string,
    userId: number,
    sessionToken: string,
    invoiceId: number,
    paymentMethodId: number,
    description: string,
    context: Record<string, unknown> = {},
    database?: string
  ): Promise<void> {
    const wizardName: TrytonWorkflowWizard = "account.invoice.pay";
    const auth = `Session ${this.encodeBase64(`${username}:${userId}:${sessionToken}`)}`;
    const fullContext = { language: "en", ...context, active_model: "account.invoice", active_ids: [invoiceId], active_id: invoiceId };
    const call = async <T>(method: "create" | "execute" | "delete", params: unknown[]): Promise<T> => {
      const res = await fetch(this.getBaseUrl(database), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify({ id: Date.now(), method: `wizard.${wizardName}.${method}`, params: [...params, fullContext] }),
        cache: "no-store",
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });
      if (!res.ok) {
        const error = new Error(`Tryton payment wizard request failed (${res.status}).`);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
      const data = await res.json();
      if (data.error) {
        if (Array.isArray(data.error) && typeof data.error[0] === "string" &&
          ["UserError", "UserWarning", "ConcurrencyException"].includes(data.error[0]) &&
          Array.isArray(data.error[1]) && typeof data.error[1][0] === "string" && data.error[1][0].trim()) {
          const error = new Error(data.error[1][0]) as HttpStatusError;
          error.status = 400;
          throw error;
        }
        const errText = JSON.stringify(data.error);
        const status = errText.includes("AccessError") || errText.includes("not allowed to access") ? 403 : 502;
        const error = new Error(status === 403 ? "Access denied while running the payment workflow." : "The GNU Health backend rejected the payment workflow.") as HttpStatusError;
        error.status = status;
        throw error;
      }
      return (data.result !== undefined ? data.result : data) as T;
    };

    const created = await call<[number | string, string, string]>("create", []);
    const wizardSessionId = created?.[0];
    if (!((typeof wizardSessionId === "number" && Number.isSafeInteger(wizardSessionId) && wizardSessionId > 0) || (typeof wizardSessionId === "string" && wizardSessionId.length > 0)) || created?.[1] !== "start" || created?.[2] !== "end") {
      throw new Error("The GNU Health backend returned an unsupported invoice-payment wizard state.");
    }

    try {
      // First execute on 'start' just fetches the server-computed defaults
      // (payee, amount = amount_to_pay, currency, company, invoice_account,
      // date) - it doesn't submit anything yet.
      const startResult = await call<{ view?: { defaults?: Record<string, unknown> } }>(
        "execute", [wizardSessionId, {}, "start"]
      );
      const rawDefaults = startResult?.view?.defaults;
      if (!rawDefaults || typeof rawDefaults.amount === "undefined" || !rawDefaults.payee) {
        throw new Error("Could not resolve the invoice payment defaults (payee/amount) from GNU Health.");
      }
      // Tryton's wizard view response mixes real field values with
      // "field." display-helper keys (e.g. "payee." -> {rec_name: "..."})
      // meant only for client rendering - echoing those back as record
      // fields isn't valid, so strip anything not a real field name.
      const defaults = Object.fromEntries(
        Object.entries(rawDefaults).filter(([key]) => !key.includes("."))
      );

      // Submit the start form (server defaults + our resolved payment method).
      // "description" has no default_description() on the server, so the
      // wizard's in-memory record never gets that attribute at all unless we
      // set it explicitly - reading it later (as Tryton itself does while
      // processing the transition) then raises "has no attribute
      // 'description'" instead of just treating it as blank.
      // Then trigger the "choice" transition, the wizard's own OK button.
      const choiceResult = await call<{ view?: { state?: string } }>(
        "execute",
        [wizardSessionId, { start: { ...defaults, payment_method: paymentMethodId, description } }, "choice"]
      );

      // Reaching "end" returns an empty result. Landing on the "ask" view
      // instead means the wizard needs partial/write-off/overpayment
      // resolution - never happens for an exact full-balance payment unless
      // there's a currency-rounding remainder, and this method refuses to
      // guess that resolution.
      if (choiceResult?.view?.state === "ask") {
        throw new Error("This invoice cannot be auto-settled for its exact balance (a partial payment, write-off, or overpayment reconciliation is required) - resolve it directly in GNU Health.");
      }
    } finally {
      await call("delete", [wizardSessionId]).catch(() => undefined);
    }
  }

}
