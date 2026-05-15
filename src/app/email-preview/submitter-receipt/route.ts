/**
 * Local-only preview of the "we got your sighting" email sent to submitters.
 * Renders fake data — no emails are sent from this route.
 */

import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { formatApproximateRatLine } from "@/lib/whererat";
import { assertPreviewAllowed, FAKE_SUBMISSION, PREVIEW_BASE_URL } from "../_fixtures";

export function GET() {
  assertPreviewAllowed();
  const s = FAKE_SUBMISSION;
  const firstName = s.submittedBy.trim().split(/\s+/)[0];

  const blocks: EmailContentBlock[] = [
    {
      kind: "paragraph",
      text: `Thanks, ${firstName}! We received your sighting and it's now in the moderation queue.`,
    },
    {
      kind: "paragraph",
      muted: true,
      text: "We'll review it shortly and email you when it's approved or declined. Approvals usually go out within a few days.",
    },
    {
      kind: "keyValue",
      rows: [
        { label: "Movie", value: `${s.movieTitle} (${s.movieYear})` },
        { label: "Point in film", value: s.timestamp },
        {
          label: "Count",
          value: `~${formatApproximateRatLine(s.approximateRatCount, s.rodentTypes)}`,
        },
      ],
    },
    { kind: "quote", text: s.description },
    { kind: "gallery", images: s.images!.map((i) => ({ url: i.url, alt: i.alt })) },
    {
      kind: "button",
      button: { label: "Browse the catalog", href: `${PREVIEW_BASE_URL}/catalog` },
    },
  ];

  const { html } = renderBrandedEmail({
    preheader: `Your sighting "${s.title}" is in the moderation queue.`,
    eyebrow: "Sighting received",
    heading: "Thanks for the sighting!",
    blocks,
    baseUrl: PREVIEW_BASE_URL,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
