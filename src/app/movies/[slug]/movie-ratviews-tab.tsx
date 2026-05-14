"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ImdbReview } from "@/lib/whererat";
import { tabCardClass, tabCardColors, tabHeaderBorderClass } from "./movie-tab-classes";

const RODENT_RE =
  /\b(rats?|ratty|rat-like|ratcatcher|mice|mouse|rodents?|gerbils?|hamsters?|squirrels?|voles?|beavers?|marmots?|guinea\s+pigs?|murine|vermin)\b/gi;

function highlightRodentWords(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  RODENT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RODENT_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <mark
        key={match.index}
        className="rounded-sm bg-amber-200/70 px-0.5 text-amber-950 not-italic dark:bg-amber-500/30 dark:text-amber-200"
      >
        {match[0]}
      </mark>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

type SortKey = "latest" | "lowest" | "highest";

function StarIcon({ fill }: { fill: "full" | "half" | "empty" }) {
  if (fill === "full") return <span className="text-amber-500 dark:text-amber-400" aria-hidden>★</span>;
  if (fill === "empty") return <span className="text-stone-300 dark:text-stone-600" aria-hidden>★</span>;
  return (
    <span className="relative inline-block" aria-hidden>
      <span className="text-stone-300 dark:text-stone-600">★</span>
      <span className="absolute inset-0 w-[52%] overflow-hidden text-amber-500 dark:text-amber-400">★</span>
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = rating / 2; // 1–10 → 0.5–5
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = i + 1 <= stars ? "full" : i < stars ? "half" : "empty";
        return <StarIcon key={i} fill={fill} />;
      })}
      <span className="ml-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
        {rating}/10
      </span>
    </span>
  );
}

function ReviewDate({ date }: { date: string }) {
  if (!date) return null;
  let formatted: string | null = null;
  try {
    formatted = new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    // Ignore invalid date strings.
  }
  if (!formatted) {
    return <span className="text-xs text-stone-400">{date}</span>;
  }
  return (
    <time
      dateTime={date}
      className="text-xs text-stone-400 dark:text-stone-500"
    >
      {formatted}
    </time>
  );
}

type Props = {
  reviews: ImdbReview[];
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

export function MovieRatviewsTab({ reviews, palette }: Props) {
  const [sort, setSort] = useState<SortKey>("latest");
  const [onlyRats, setOnlyRats] = useState(false);
  const [listFlash, setListFlash] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/immutability
    if (!collapsed) firstVisibleSeen = true;
    return { review, collapsed, addMargin };
  });

  const selectSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_22%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_40%,rgb(253_251_246))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(76_72_69))] dark:bg-[color-mix(in_srgb,var(--movie-accent)_16%,rgb(26_20_14))] dark:text-stone-100"
    : "border-stone-950/85 bg-[var(--wr-surface-cream-muted)]";

  return (
    <div>
      <header className={`mb-6 border-b pb-4 ${tabHeaderBorderClass(palette)}`}>
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h2 className="wr-display text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
            Reviews
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Rat-only toggle */}
            {ratCount > 0 ? (
              <div className="flex cursor-pointer items-center gap-2 select-none">
                <span className="whitespace-nowrap text-sm font-bold leading-none text-stone-800 dark:text-stone-200">
                  Rodent filter:
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={onlyRats}
                  aria-label="Show only reviews that mention rodents"
                  onClick={() => setOnlyRats((v) => !v)}
                  className={[
                    "relative inline-flex h-9 w-[3.75rem] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--movie-accent,#ea580c)_65%,rgb(245_240_232/0.7))] focus-visible:ring-offset-1",
                    onlyRats
                      ? "border-[color-mix(in_srgb,var(--movie-accent,#ea580c)_88%,#000)] bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_80%,white)] dark:border-[color-mix(in_srgb,var(--movie-accent,#ea580c)_78%,white)] dark:bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_78%,white)]"
                      : "border-stone-400 bg-stone-300 dark:border-stone-500 dark:bg-stone-600",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                      onlyRats
                        ? "translate-x-[1.75rem] bg-white shadow opacity-100"
                        : "translate-x-0.5 bg-white opacity-70",
                    ].join(" ")}
                  >
                    <img src="/openmoji/color/svg/1F400.svg" alt="Rat" width={18} height={18} />
                  </span>
                </button>
              </div>
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

          </div>
        </div>
      </header>


      {reviews.length === 0 ? (
        <div className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center ${tabCardColors(palette)}`}>
          <img src="/openmoji/color/svg/1F4DD.svg" alt="" width={40} height={40} className="mx-auto" aria-hidden />
          <p className="wr-display mt-4 text-lg font-bold text-stone-800 dark:text-stone-100">
            No reviews yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600 dark:text-stone-400">
            Hit <strong>Resync</strong> to pull reviews from IMDb.
          </p>
        </div>
      ) : (
        <>
          <div className={`transition-opacity duration-150 ${listFlash ? "opacity-50" : "opacity-100"}`}>
            {rowMeta.map(({ review, collapsed, addMargin }) => (
              <div
                key={review.id}
                className={`overflow-hidden transition-all duration-300 ${collapsed
                  ? "max-h-0 opacity-0"
                  : `pb-[3px] pr-[3px] max-h-[2000px] opacity-100${addMargin ? " mt-4" : ""}`
                  }`}
              >
                <ReviewCard
                  review={review}
                  className={cardClass}
                  highlight={review.mentionsRat}
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
  highlight = false,
}: {
  review: ImdbReview;
  className: string;
  highlight?: boolean;
}) {
  const isLong = review.text.length > 400;

  return (
    <article
      className={`${className} ${highlight
        ? "ring-2 ring-inset ring-[color-mix(in_srgb,var(--movie-accent,#ea580c)_62%,rgb(245_240_232/0.38))] dark:ring-[color-mix(in_srgb,var(--movie-accent,#ea580c)_52%,rgb(245_240_232/0.32))]"
        : ""
        }`}
    >
      {/* Top row: author + date, then rating on same line at sm+ */}
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-x-3">
        <div className="flex items-center gap-x-3">
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
              className="cursor-default leading-none"
              title="This review mentions rats!"
            >
              <img src="/openmoji/color/svg/1F400.svg" alt="Rat" width={20} height={20} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Summary (title of the review) */}
      {review.summary ? (
        <p className="mb-1.5 text-base font-bold leading-snug text-stone-900 dark:text-stone-100">
          {highlightRodentWords(review.summary)}
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
                  {highlightRodentWords(review.text)}
                </p>
                <span className="mt-1 inline-block text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Read more ↓
                </span>
              </div>
              {/* Open view */}
              <div className="hidden group-open:block">
                <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {highlightRodentWords(review.text)}
                </p>
                <span className="mt-1 inline-block text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Show less ↑
                </span>
              </div>
            </summary>
          </details>
        ) : (
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {highlightRodentWords(review.text)}
          </p>
        )
      ) : null}
    </article>
  );
}
