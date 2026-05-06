"use client";

import { useEffect, useState } from "react";
import type { ImdbReview } from "@/lib/whererat";
import { tabCardClass, tabHeaderBorderClass } from "./movie-tab-classes";

type SortKey = "latest" | "lowest" | "highest";

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating / 2); // 1–10 → 1–5 stars
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={
            i < filled
              ? "text-amber-500 dark:text-amber-400"
              : "text-stone-300 dark:text-stone-600"
          }
          aria-hidden
        >
          ★
        </span>
      ))}
      <span className="ml-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
        {rating}/10
      </span>
    </span>
  );
}

function ReviewDate({ date }: { date: string }) {
  if (!date) return null;
  try {
    return (
      <time
        dateTime={date}
        className="text-xs text-stone-400 dark:text-stone-500"
      >
        {new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })}
      </time>
    );
  } catch {
    return <span className="text-xs text-stone-400">{date}</span>;
  }
}

type Props = {
  reviews: ImdbReview[];
  imdbId: string;
  palette: boolean;
};

function sortReviews(reviews: ImdbReview[], sort: SortKey): ImdbReview[] {
  const copy = [...reviews];
  if (sort === "latest") {
    return copy.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
  if (sort === "highest") {
    return copy.sort((a, b) => {
      if (a.rating == null && b.rating == null) return 0;
      if (a.rating == null) return 1;
      if (b.rating == null) return -1;
      return b.rating - a.rating;
    });
  }
  // lowest
  return copy.sort((a, b) => {
    if (a.rating == null && b.rating == null) return 0;
    if (a.rating == null) return 1;
    if (b.rating == null) return -1;
    return a.rating - b.rating;
  });
}

export function MovieRatviewsTab({ reviews, imdbId, palette }: Props) {
  const [sort, setSort] = useState<SortKey>("latest");
  const [onlyRats, setOnlyRats] = useState(false);
  const [listFlash, setListFlash] = useState(false);

  useEffect(() => {
    setListFlash(true);
    const t = setTimeout(() => setListFlash(false), 400);
    return () => clearTimeout(t);
  }, [onlyRats, sort]);

  const ratCount = reviews.filter((r) => r.mentionsRat).length;
  const sorted = sortReviews(reviews, sort);
  const cardClass = tabCardClass(palette);

  // Pre-compute spacing: first visible card gets no top margin (matches space-y-4 behaviour in other tabs)
  let firstVisibleSeen = false;
  const rowMeta = sorted.map((review) => {
    const collapsed = onlyRats && !review.mentionsRat;
    const addMargin = !collapsed && firstVisibleSeen;
    if (!collapsed) firstVisibleSeen = true;
    return { review, collapsed, addMargin };
  });

  const selectSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_22%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_40%,rgb(253_251_246))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(76_72_69))] dark:bg-[rgb(34_29_24)] dark:text-stone-100"
    : "border-stone-950/85 bg-[var(--wr-surface-cream-muted)]";

  return (
    <div>
      <header className={`mb-6 border-b pb-4 ${tabHeaderBorderClass(palette)}`}>
        <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="wr-display text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
            Reviews:
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Rat-only toggle */}
            {ratCount > 0 ? (
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <span className="whitespace-nowrap text-sm font-bold leading-none text-stone-800 dark:text-stone-200">
                  Rat filter:
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={onlyRats}
                  aria-label="Show only reviews that mention rats"
                  onClick={() => setOnlyRats((v) => !v)}
                  className={[
                    "relative inline-flex h-9 w-[3.75rem] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-1",
                    onlyRats
                      ? "border-amber-500 bg-amber-400 dark:border-amber-400 dark:bg-amber-500"
                      : "border-stone-400 bg-stone-300 dark:border-stone-500 dark:bg-stone-600",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 text-base leading-none",
                      onlyRats
                        ? "translate-x-[1.75rem] bg-white shadow opacity-100"
                        : "translate-x-0.5 bg-white opacity-70",
                    ].join(" ")}
                  >
                    🐀
                  </span>
                </button>
              </label>
            ) : null}

            {/* Sort control */}
            <label className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm font-bold leading-none text-stone-800 dark:text-stone-200">
                Sort by:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort reviews"
                className={`wr-select py-2 pl-3 ${selectSkin}`}
              >
                <option value="latest">Latest</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </label>

            <a
              href={`https://www.imdb.com/title/${imdbId}/reviews/`}
              target="_blank"
              rel="noreferrer"
              title="All reviews on IMDb"
              aria-label="All reviews on IMDb"
              className="wr-btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold"
            >
              View on IMDb
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
          No reviews synced yet. Hit <strong>Resync</strong> to pull from IMDb.
        </p>
      ) : (
        <>
          <div className={`transition-opacity duration-150 ${listFlash ? "opacity-50" : "opacity-100"}`}>
            {rowMeta.map(({ review, collapsed, addMargin }) => (
              <div
                key={review.id}
                className={`overflow-hidden transition-all duration-300 ${
                  collapsed
                    ? "max-h-0 opacity-0"
                    : `pb-[3px] pr-[3px] max-h-[2000px] opacity-100${addMargin ? " mt-4" : ""}`
                }`}
              >
                <ReviewCard
                  review={review}
                  className={cardClass}
                  dim={!onlyRats && !review.mentionsRat}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  className,
  dim = false,
}: {
  review: ImdbReview;
  className: string;
  dim?: boolean;
}) {
  const isLong = review.text.length > 400;

  return (
    <article className={`${className} transition-opacity ${dim ? "opacity-50" : "opacity-100"}`}>
      {/* Top row: author + date on left, rating + rat badge on right */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
            {review.author}
          </span>
          <ReviewDate date={review.date} />
        </div>
        <div className="flex items-center gap-2">
          {review.rating != null ? <StarRating rating={review.rating} /> : null}
          {review.mentionsRat ? (
            <span
              aria-label="Mentions rats"
              className="cursor-default text-base leading-none"
              title="This review mentions rats!"
            >
              🐀
            </span>
          ) : null}
        </div>
      </div>

      {/* Summary (title of the review) */}
      {review.summary ? (
        <p className="mb-1.5 text-base font-bold leading-snug text-stone-900 dark:text-stone-100">
          {review.summary}
        </p>
      ) : null}

      {/* Body — long reviews use <details> for native expand/collapse */}
      {review.text ? (
        isLong ? (
          <details className="group">
            {/* Everything inside <summary> so clicking anywhere — including
                "Show less" — toggles the <details> natively. */}
            <summary className="cursor-pointer list-none">
              {/* Closed view */}
              <div className="group-open:hidden">
                <p className="line-clamp-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {review.text}
                </p>
                <span className="mt-1 inline-block text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Read more ↓
                </span>
              </div>
              {/* Open view */}
              <div className="hidden group-open:block">
                <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {review.text}
                </p>
                <span className="mt-1 inline-block text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Show less ↑
                </span>
              </div>
            </summary>
          </details>
        ) : (
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {review.text}
          </p>
        )
      ) : null}
    </article>
  );
}
