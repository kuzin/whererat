/**
 * Local-only preview of the "your sighting wasn't approved" email sent to submitters.
 * Renders fake data — no emails are sent from this route.
 */

import { renderBrandedEmail, type EmailContentBlock } from "@/lib/email-template";
import { assertPreviewAllowed, FAKE_SUBMISSION, PREVIEW_BASE_URL, wrapWithPreviewNav } from "../_fixtures";

const SUBMITTER_FOOTER = "You're receiving this because you submitted a sighting to WhereRat.";

export function GET() {
  assertPreviewAllowed();
  const s = FAKE_SUBMISSION;
  const firstName = s.submittedBy.trim().split(/\s+/)[0];

  const blocks: EmailContentBlock[] = [
    {
      kind: "paragraph",
      text: `Thanks for the submission, ${firstName}. After review, this one wasn't a fit for the catalog.`,
    },
    {
      kind: "button",
      button: { label: "Browse the catalog", href: `${PREVIEW_BASE_URL}/catalog` },
    },
  ];

  const { html } = renderBrandedEmail({
    preheader: `An update on your sighting "${s.title}".`,
    heading: "Not quite this time.",
    emoji: "🐭",
    centered: true,
    footerNote: SUBMITTER_FOOTER,
    blocks,
    baseUrl: PREVIEW_BASE_URL,
  });

  return new Response(wrapWithPreviewNav(html, "submitter-declined"), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
