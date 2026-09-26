/**
 * Email delivery remains disabled until a real, monitored SMTP provider is configured.
 * Never report a local spool write as successful message delivery.
 */
export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(_options: MailOptions): Promise<never> {
  throw new Error("Email transport is not configured; no email was sent.");
}
