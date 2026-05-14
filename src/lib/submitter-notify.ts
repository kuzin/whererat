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
import { formatApproximateRatLine, type Submission } from "@/lib/whererat";

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
  const isSeries = submission.imdbKind === "series";

  const firstName = submission.submittedBy?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? `Thanks, ${firstName}! We received your sighting and it's now in the moderation queue.`
    : `Thanks! We received your sighting and it's now in the moderation queue.`;

  const blocks: EmailContentBlock[] = [
    { kind: "paragraph", text: greeting },
    {
      kind: "paragraph",
      muted: true,
      text: "We'll review it shortly and email you when it's approved or declined. Approvals usually go out within a few days.",
    },
    {
      kind: "keyValue",
      rows: [
        { label: "Movie", value: movieDisplay(submission) },
        { label: `Point in ${isSeries ? "episode" : "film"}`, value: submission.timestamp },
        {
          label: "Count",
          value: `~${formatApproximateRatLine(
            submission.approximateRatCount,
            submission.rodentTypes,
          )}`,
        },
      ],
    },
    { kind: "quote", text: submission.description },
  ];

  if (submission.images?.length) {
    blocks.push({
      kind: "gallery",
      images: submission.images.map((img) => ({ url: img.url, alt: img.alt })),
    });
  }

  blocks.push({
    kind: "button",
    button: { label: "Browse the catalog", href: `${siteUrl()}/catalog` },
  });

  const { html, text } = renderBrandedEmail({
    preheader: `Your sighting "${headline}" is in the moderation queue.`,
    eyebrow: "Sighting received",
    heading: "Thanks for the sighting!",
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
