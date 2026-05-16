import { getDbPool } from "@/lib/db";

export type NewsletterSend = {
  id: string;
  sentAt: Date;
  sentById: string;
  sentByName: string;
  recipientCount: number;
  subject: string;
  newsItemIds: string[];
};

/**
 * Records a newsletter digest send with the included news items. Call this
 * BEFORE fanning out emails so that even a partial Resend failure leaves a
 * complete record (the recipient count is the intended audience size).
 */
export async function recordNewsletterSend(input: {
  subject: string;
  sentById: string;
  sentByName: string;
  recipientCount: number;
  newsItemIds: string[];
}): Promise<string> {
  const pool = getDbPool();
  const id = `nl-${crypto.randomUUID()}`;
  await pool.query(
    `insert into newsletter_sends (id, sent_by_id, sent_by_name, recipient_count, subject)
     values ($1, $2, $3, $4, $5)`,
    [id, input.sentById, input.sentByName, input.recipientCount, input.subject],
  );
  for (const [index, newsItemId] of input.newsItemIds.entries()) {
    await pool.query(
      `insert into newsletter_send_items (newsletter_send_id, news_item_id, sort_order)
       values ($1, $2, $3)
       on conflict do nothing`,
      [id, newsItemId, index],
    );
  }
  return id;
}

/** Set of news_item ids that have appeared in at least one prior digest send. */
export async function getSentNewsItemIds(): Promise<Set<string>> {
  const pool = getDbPool();
  const result = await pool.query<{ news_item_id: string }>(
    `select distinct news_item_id from newsletter_send_items`,
  );
  return new Set(result.rows.map((r) => r.news_item_id));
}
