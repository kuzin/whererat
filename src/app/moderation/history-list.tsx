"use client";

import { useState } from "react";
import { HistoryCard } from "./history-card";
import type { Submission } from "@/lib/whererat";

const PAGE_SIZE = 20;

type HistoryItem = {
  submission: Submission;
  reviewerName?: string;
  viewHref?: string;
};

export function HistoryList({
  items,
  mode,
  rereviewAction,
  removeAction,
}: {
  items: HistoryItem[];
  mode: "approved" | "denied";
  rereviewAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-500/75 bg-stone-100/90 p-10 text-center dark:border-white/20 dark:bg-stone-900/40">
        <img src="/openmoji/color/svg/1F573.svg" alt="" width={40} height={40} className="mx-auto" aria-hidden />
        <h3 className="wr-display mt-3 text-2xl font-bold">
          Quiet burrow. No crumbs.
        </h3>
        <p className="mt-2 text-stone-700 dark:text-stone-300">
          {mode === "approved"
            ? "Approved sightings will appear here once you publish a submission."
            : "Denied submissions will appear here for reference and possible re-review."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {slice.map((item) => (
          <HistoryCard
            key={item.submission.id}
            submission={item.submission}
            historyTab={mode}
            reviewerName={item.reviewerName}
            viewHref={item.viewHref}
            returnTo="/moderation"
            rereviewAction={rereviewAction}
            removeAction={removeAction}
          />
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="wr-btn bg-stone-950 text-amber-100 disabled:cursor-not-allowed disabled:border-stone-400 disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:border-white/12 dark:disabled:bg-stone-800 dark:disabled:text-stone-500"
          >
            ← Previous
          </button>
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
            Page {safePage} of {pageCount}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage === pageCount}
            className="wr-btn bg-stone-950 text-amber-100 disabled:cursor-not-allowed disabled:border-stone-400 disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:border-white/12 dark:disabled:bg-stone-800 dark:disabled:text-stone-500"
          >
            Next →
          </button>
        </div>
      ) : null}
    </>
  );
}
