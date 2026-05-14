"use client";

import { useFormStatus } from "react-dom";

export function ResyncAllButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title="Resync all movie titles"
      aria-label="Resync all movie titles"
      className="wr-btn-ghost inline-flex h-11 w-11 items-center justify-center px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pending ? "animate-spin" : ""}
        aria-hidden
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </button>
  );
}
