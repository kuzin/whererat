"use client";

import { useFormStatus } from "react-dom";

function ResyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={spinning ? "animate-spin" : undefined}
    >
      {spinning ? (
        <path d="M21 12a9 9 0 1 1-9-9" />
      ) : (
        <>
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </>
      )}
    </svg>
  );
}

/** Resync icon button — shows a spinner while the server action is in flight. */
export function ResyncButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={pending ? "Resyncing…" : "Resync from IMDb"}
      title={pending ? "Resyncing…" : "Resync from IMDb"}
      className="wr-btn-ghost inline-flex h-11 w-11 items-center justify-center px-0 py-0 disabled:opacity-60"
    >
      <ResyncIcon spinning={pending} />
    </button>
  );
}

/** Resync menu-item — used inside an ActionMenuRow overflow dropdown. */
export function ResyncMenuButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-60 dark:text-stone-200 dark:hover:bg-stone-800 [&_svg]:h-4 [&_svg]:w-4"
      role="menuitem"
    >
      <ResyncIcon spinning={pending} />
      {pending ? "Resyncing…" : "Resync from IMDb"}
    </button>
  );
}
