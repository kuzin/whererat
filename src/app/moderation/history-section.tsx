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

export function HistorySection({
  approvedItems,
  deniedItems,
  initialTab = "approved",
  rereviewAction,
  removeAction,
}: {
  approvedItems: HistoryItem[];
  deniedItems: HistoryItem[];
  initialTab?: "approved" | "denied";
  rereviewAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
}) {
  const [tab, setTab] = useState<"approved" | "denied">(initialTab);
  const [page, setPage] = useState(1);

  const items = tab === "approved" ? approvedItems : deniedItems;
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function switchTab(next: "approved" | "denied") {
    setTab(next);
    setPage(1);
  }

  return (
    <div className="mt-10 border-t border-stone-900/15 pt-8 dark:border-white/12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black tracking-tight text-stone-950 dark:text-stone-100">
          {tab === "approved" ? "Approved sightings" : "Denied sightings"}
        </h2>
        <div className="inline-flex rounded-xl border border-stone-900/18 bg-white p-1 dark:border-white/12 dark:bg-stone-900/70">
          <button
            type="button"
            onClick={() => switchTab("approved")}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
              tab === "approved"
                ? "bg-stone-950 text-amber-100"
                : "text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white"
            }`}
          >
            Approved ({approvedItems.length})
          </button>
          <button
            type="button"
            onClick={() => switchTab("denied")}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
              tab === "denied"
                ? "bg-stone-950 text-amber-100"
                : "text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white"
            }`}
          >
            Denied ({deniedItems.length})
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-stone-500/75 bg-stone-100/90 p-8 text-center dark:border-white/20 dark:bg-stone-900/40">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            No {tab} sightings yet.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {slice.map((item) => (
            <HistoryCard
              key={item.submission.id}
              submission={item.submission}
              historyTab={tab}
              reviewerName={item.reviewerName}
              viewHref={item.viewHref}
              returnTo="/moderation"
              rereviewAction={rereviewAction}
              removeAction={removeAction}
            />
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className={`wr-btn ${safePage === 1 ? "pointer-events-none bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-500" : "bg-stone-950 text-amber-100"}`}
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
            className={`wr-btn ${safePage === pageCount ? "pointer-events-none bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-500" : "bg-stone-950 text-amber-100"}`}
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}
