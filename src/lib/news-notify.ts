/**
 * Newsletter email sent to marketing opt-in subscribers when a news item is
 * published with "Send newsletter" checked in the moderation UI.
 *
 * Best-effort — individual send failures are logged but never throw.
 */

import { sendBrandedEmail } from "@/lib/email-send";
import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { getMarketingSubscribers } from "@/lib/email-preferences-store";
import type { NewsItem } from "@/lib/news-store";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://whererat.com";
}

export function buildNewsletterEmail(
  item: NewsItem,
  unsubscribeToken: string,
  baseUrl = siteUrl(),
): { subject: string; html: string; text: string } {
  const subject = item.title;
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

  const blocks: EmailContentBlock[] = [
    { kind: "paragraph", text: item.body },
    {
      kind: "button",
      button: { label: "Read on WhereRat", href: `${baseUrl}/news` },
    },
  ];

  const { html, text } = renderBrandedEmail({
    preheader: item.body.slice(0, 120),
    eyebrow: "WhereRat news",
    heading: item.title,
    footerNote: `You're receiving this because you opted in to WhereRat updates. · Unsubscribe: ${unsubscribeUrl}`,
    blocks,
    baseUrl,
  });

  // Append unsubscribe link to the HTML footer note — inject before closing body
  const unsubscribeLink = `<a href="${unsubscribeUrl}" style="color:inherit;text-decoration:underline">Unsubscribe</a>`;
  const htmlWithUnsub = html.replace(
    `Unsubscribe: ${unsubscribeUrl}`,
    unsubscribeLink,
  );

  return { subject, html: htmlWithUnsub, text };
}

export async function sendNewsletterToSubscribers(item: NewsItem): Promise<void> {
  const subscribers = await getMarketingSubscribers();
  if (!subscribers.length) return;

  await Promise.allSettled(
    subscribers.map(({ email, unsubscribeToken }) => {
      const { subject, html, text } = buildNewsletterEmail(item, unsubscribeToken);
      return sendBrandedEmail({ to: email, subject, html, text, logTag: "newsletter" });
    }),
  );
}
