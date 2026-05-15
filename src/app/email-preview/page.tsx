/**
 * Local-only index of transactional email previews. Each link renders the
 * email's HTML inline so we can iterate on design without sending anything.
 * Safe to ship — pages just render fake data with no side effects.
 */

import { assertPreviewAllowed } from "./_fixtures";

export default function EmailPreviewIndex() {
  assertPreviewAllowed();
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Email previews</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Local renders of the WhereRat transactional emails. No emails are sent from these pages.
      </p>
      <ul className="mt-8 space-y-3">
        <li>
          <a
            className="text-orange-700 underline underline-offset-2 hover:decoration-orange-950 dark:text-amber-200"
            href="/email-preview/moderation"
          >
            Moderator — new sighting in queue
          </a>
        </li>
        <li>
          <a
            className="text-orange-700 underline underline-offset-2 hover:decoration-orange-950 dark:text-amber-200"
            href="/email-preview/submitter-receipt"
          >
            Submitter — sighting received
          </a>
        </li>
        <li>
          <a
            className="text-orange-700 underline underline-offset-2 hover:decoration-orange-950 dark:text-amber-200"
            href="/email-preview/submitter-approved"
          >
            Submitter — sighting approved
          </a>
        </li>
        <li>
          <a
            className="text-orange-700 underline underline-offset-2 hover:decoration-orange-950 dark:text-amber-200"
            href="/email-preview/submitter-declined"
          >
            Submitter — sighting declined
          </a>
        </li>
        <li>
          <a
            className="text-orange-700 underline underline-offset-2 hover:decoration-orange-950 dark:text-amber-200"
            href="/email-preview/newsletter"
          >
            Newsletter — news post
          </a>
        </li>
      </ul>
    </main>
  );
}
