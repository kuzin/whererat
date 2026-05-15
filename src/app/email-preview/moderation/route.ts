/**
 * Local-only preview of the "new sighting" email sent to moderators.
 * Renders fake data — no emails are sent from this route.
 */

import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { formatApproximateRatLine } from "@/lib/whererat";
import { assertPreviewAllowed, FAKE_SUBMISSION, PREVIEW_BASE_URL, wrapWithPreviewNav } from "../_fixtures";

export function GET() {
  assertPreviewAllowed();
  const s = FAKE_SUBMISSION;
  const moderationUrl = `${PREVIEW_BASE_URL}/moderation`;

  const blocks: EmailContentBlock[] = [
    {
      kind: "paragraph",
      text: `A new sighting "${s.title}" is waiting for review.`,
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
        { label: "Submitted by", value: `${s.submittedBy} · ${s.submitterEmail}` },
        { label: "IMDb", value: s.imdbId! },
      ],
    },
    { kind: "quote", text: s.description },
    { kind: "gallery", images: s.images!.map((i) => ({ url: i.url, alt: i.alt })) },
    { kind: "button", button: { label: "Review in moderation queue", href: moderationUrl } },
  ];

  const { html } = renderBrandedEmail({
    preheader: `${s.movieTitle} (${s.movieYear}) — submitted by ${s.submittedBy}`,
    eyebrow: "New sighting",
    heading: s.title!,
    blocks,
    baseUrl: PREVIEW_BASE_URL,
  });

  return new Response(wrapWithPreviewNav(html, "moderation"), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
