import { getDbPool } from "@/lib/db";

export type EmailSubscriber = {
  email: string;
  unsubscribeToken: string;
};

/**
 * Records that this email address has opted in to marketing emails.
 * Idempotent — safe to call on every submission if the box is checked.
 */
export async function upsertMarketingOptIn(email: string): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `INSERT INTO email_preferences (email, marketing_opt_in)
     VALUES ($1, true)
     ON CONFLICT (email) DO UPDATE
       SET marketing_opt_in = true, updated_at = now()`,
    [email],
  );
}

/** Returns all emails that are currently opted in to marketing. */
export async function getMarketingSubscribers(): Promise<EmailSubscriber[]> {
  const pool = getDbPool();
  const result = await pool.query<{ email: string; unsubscribe_token: string }>(
    `SELECT email, unsubscribe_token FROM email_preferences WHERE marketing_opt_in = true`,
  );
  return result.rows.map((r) => ({ email: r.email, unsubscribeToken: r.unsubscribe_token }));
}

/**
 * Unsubscribes the owner of this token.
 * Returns true if a matching opted-in row was found and updated, false otherwise.
 */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const pool = getDbPool();
  const result = await pool.query(
    `UPDATE email_preferences
        SET marketing_opt_in = false, updated_at = now()
      WHERE unsubscribe_token = $1 AND marketing_opt_in = true`,
    [token],
  );
  return (result.rowCount ?? 0) > 0;
}
