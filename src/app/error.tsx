"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="wr-page-shell flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="wr-cheese-panel wr-cheese-tile-cream w-full max-w-lg px-10 py-16">
        <img src="/openmoji/color/svg/1F400.svg" alt="Rat" width={64} height={64} className="mx-auto" />
        <h1 className="wr-display mt-4 text-3xl font-bold text-stone-950 dark:text-stone-50">
          Something went wrong.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone-600 dark:text-stone-400">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="wr-btn-primary inline-flex px-5 py-2.5 text-sm font-semibold"
          >
            Try again
          </button>
          <Link
            href="/#catalog"
            className="wr-btn-ghost inline-flex px-5 py-2.5 text-sm font-semibold"
          >
            ← Back to catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
