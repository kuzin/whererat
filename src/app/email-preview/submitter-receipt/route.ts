/**
 * Local-only preview of the "we got your sighting" email sent to submitters.
 * Renders fake data — no emails are sent from this route.
 */

import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { assertPreviewAllowed, FAKE_SUBMISSION, PREVIEW_BASE_URL } from "../_fixtures";

export function GET() {
  assertPreviewAllowed();
  const s = FAKE_SUBMISSION;
  const firstName = s.submittedBy.trim().split(/\s+/)[0];

  const blocks: EmailContentBlock[] = [
    {
      kind: "paragraph",
      text: `We got it, ${firstName}! We'll email you when it's reviewed — usually within a few days.`,
    },
    {
      kind: "button",
      button: { label: "Browse the catalog", href: `${PREVIEW_BASE_URL}/catalog` },
    },
  ];

  const { html } = renderBrandedEmail({
    preheader: `Your sighting "${s.title}" is in the moderation queue.`,
    heading: "Thanks for the sighting!",
    emoji: "🐀",
    centered: true,
    blocks,
    baseUrl: PREVIEW_BASE_URL,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
