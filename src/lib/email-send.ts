/**
 * Shared transactional-email sender. Wraps Resend's /emails endpoint with
 * best-effort semantics: missing API key / per-recipient failures are logged
 * but never thrown, so callers can fire-and-forget without breaking flows.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "WhereRat <no-reply@whererat.com>";

export type SendBrandedEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional override of the From address. Defaults to MODERATION_NOTIFY_FROM env or the WhereRat default. */
  from?: string;
  /** Tag for log lines, e.g. "moderation-notify", "submitter-notify". */
  logTag?: string;
  /**
   * Extra SMTP headers (e.g. List-Unsubscribe, List-Unsubscribe-Post).
   * Resend's API accepts a flat string→string map and forwards them verbatim.
   */
  headers?: Record<string, string>;
};

export async function sendBrandedEmail({
  to,
  subject,
  html,
  text,
  from,
  logTag = "email-send",
  headers,
}: SendBrandedEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[${logTag}] RESEND_API_KEY not set; skipping send to ${to}.`);
    return;
  }
  const fromAddr = from ?? process.env.MODERATION_NOTIFY_FROM ?? DEFAULT_FROM;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to,
        subject,
        html,
        text,
        ...(headers && Object.keys(headers).length ? { headers } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[${logTag}] Resend ${res.status} for ${to}: ${body}`);
    }
  } catch (e) {
    console.warn(`[${logTag}] send failed for ${to}:`, e);
  }
}
