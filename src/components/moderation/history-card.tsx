"use client";

import { useState } from "react";
import Link from "next/link";
import { SightingMarkdown } from "@/components/ui/sighting-markdown";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import type { Submission } from "@/lib/whererat";

export function HistoryCard({
  submission,
  historyTab,
  reviewerName,
  viewHref,
  returnTo,
  rereviewAction,
  removeAction,
}: {
  submission: Submission;
  historyTab: "approved" | "denied";
  reviewerName?: string;
  viewHref?: string;
  returnTo: string;
  rereviewAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusClass =
    historyTab === "approved"
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/45 dark:text-emerald-100"
      : "bg-red-100 text-red-900 dark:bg-red-900/45 dark:text-red-100";

  const title =
    submission.title?.trim() ||
    `${submission.movieTitle}${submission.movieYear ? ` (${submission.movieYear})` : ""}`;

  const subtitle = [
    submission.movieTitle,
    submission.movieYear ? `(${submission.movieYear})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="overflow-hidden rounded-xl border border-stone-900/25 bg-stone-50 dark:border-white/12 dark:bg-stone-900/70">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-100/70 dark:hover:bg-white/4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-stone-950 dark:text-stone-100">
            {title}
          </p>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${statusClass}`}>
          {submission.status}
        </span>
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`size-4 shrink-0 text-stone-400 transition-transform duration-150 dark:text-stone-500 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M8 10.94 2.53 5.47l1.06-1.06L8 8.82l4.41-4.41 1.06 1.06L8 10.94Z" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded ? (
        <div className="border-t border-stone-900/10 px-4 pb-4 pt-3 dark:border-white/10">
          <div className="text-sm text-stone-700 dark:text-stone-300">
            <SightingMarkdown markdown={submission.description} />
          </div>

          <div className="mt-4 border-t border-stone-900/8 pt-3 dark:border-white/8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500">
              {historyTab === "approved" ? "Approved" : "Denied"} by{" "}
              {reviewerName ?? "Unknown"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {historyTab === "approved" ? (
                viewHref ? (
                  <Link
                    href={viewHref}
                    className="wr-btn-ghost px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
                  >
                    View
                  </Link>
                ) : (
                  <span className="rounded-md border border-stone-400/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:border-white/18 dark:text-stone-400">
                    View unavailable
                  </span>
                )
              ) : null}
              <Link
                href={`/moderation?edit=${submission.id}`}
                className="wr-btn-ghost px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
              >
                Edit
              </Link>
              <form action={rereviewAction}>
                <input type="hidden" name="submissionId" value={submission.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className="wr-btn-ghost border-emerald-700/35 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-950/35 dark:text-emerald-200 dark:hover:bg-emerald-950/45"
                >
                  Re-review
                </button>
              </form>
              <form action={removeAction}>
                <input type="hidden" name="submissionId" value={submission.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <ConfirmSubmitButton
                  confirmMessage="Delete this submission permanently?"
                  type="submit"
                  className="wr-btn-ghost border-red-700/35 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-red-800 hover:bg-red-100 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-200 dark:hover:bg-red-950/45"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
