/**
 * Transactional emails sent to the person who submitted a sighting:
 *   - "We got your sighting" — on submission
 *   - (future) "Approved" / "Declined" — after moderation review
 *
 * All sends are best-effort and never throw — submission flows are never
 * blocked by an email failure.
 */

import { sendBrandedEmail } from "@/lib/email-send";
import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { type Submission } from "@/lib/whererat";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://whererat.com";
}

function movieDisplay(submission: Submission): string {
  const base = submission.movieYear
    ? `${submission.movieTitle} (${submission.movieYear})`
    : submission.movieTitle;
  if (
    submission.imdbKind === "series" &&
    submission.seasonNumber &&
    submission.episodeNumber
  ) {
    const ep = `S${submission.seasonNumber}E${submission.episodeNumber}${
      submission.episodeTitle ? `: ${submission.episodeTitle}` : ""
    }`;
    return `${base} — ${ep}`;
  }
  return base;
}

function buildReceiptEmail(submission: Submission) {
  const headline = submission.title?.trim() || movieDisplay(submission);
  const subject = `We got your sighting: ${headline}`;

  const firstName = submission.submittedBy?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? `We got it, ${firstName}! We’ll email you when it’s reviewed — usually within a few days.`
    : `We got it! We’ll email you when it’s reviewed — usually within a few days.`;

  const blocks: EmailContentBlock[] = [
    {
      kind: "paragraph",
      text: greeting,
    },
    {
      kind: "button",
      button: { label: "Browse the catalog", href: `${siteUrl()}/catalog` },
    },
  ];

  const { html, text } = renderBrandedEmail({
    preheader: `Your sighting “${headline}” is in the moderation queue.`,
    heading: "Thanks for the sighting!",
    emoji: "🐀",
    centered: true,
    blocks,
  });

  return { subject, html, text };
}

export async function notifySubmitterOfReceipt(submission: Submission): Promise<void> {
  const to = submission.submitterEmail?.trim();
  if (!to) return;

  const { subject, html, text } = buildReceiptEmail(submission);
  await sendBrandedEmail({ to, subject, html, text, logTag: "submitter-notify" });
}
