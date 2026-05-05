"use client";

import { useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MOVIE_SIGHTINGS_PAGE_SIZE,
  buildMovieSightingsPath,
  movieSightingsSortLabels,
  movieSightingsSortOptions,
  type MovieSightingsSortOption,
} from "@/lib/whererat";

function sortSelectChevronUrl(stroke: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 8 4 4 4-4"/></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

type SortProps = {
  slug: string;
  sort: MovieSightingsSortOption;
  palette: boolean;
};

export function MovieSightingsSortControl({ slug, sort, palette }: SortProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const selectSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_22%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_40%,rgb(253_251_246))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(76_72_69))] dark:bg-[rgb(34_29_24)] dark:text-stone-100"
    : "border-stone-950/85 bg-[#fffbf5]";

  const pushSort = (nextSort: MovieSightingsSortOption) => {
    const href = buildMovieSightingsPath(slug, {
      sort: nextSort,
      page: 1,
    });
    startTransition(() => router.push(href, { scroll: false }));
  };

  const bottomDividerSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_26%,rgb(120_113_108/0.72))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(245_240_232/0.24))]"
    : "border-stone-900/22 dark:border-white/18";

  return (
    <label className="flex w-full flex-row flex-wrap items-center gap-3 sm:w-auto sm:max-w-none">
      <span className="whitespace-nowrap text-sm font-bold text-stone-800 dark:text-stone-200">
        Sort by
      </span>
      <select
        className={`wr-input min-w-[12.5rem] flex-1 appearance-none bg-[length:1.125rem_1.125rem] bg-[position:right_0.875rem_center] bg-no-repeat py-2 pl-3 pr-12 [background-image:var(--wr-sort-chevron)] sm:flex-initial dark:[background-image:var(--wr-sort-chevron-dark)] ${selectSkin}`}
        style={
          {
            "--wr-sort-chevron": sortSelectChevronUrl("#57534e"),
            "--wr-sort-chevron-dark": sortSelectChevronUrl("#d6d3d1"),
          } as CSSProperties
        }
        value={sort}
        disabled={pending}
        onChange={(event) =>
          pushSort(event.target.value as MovieSightingsSortOption)
        }
      >
        {movieSightingsSortOptions.map((option) => (
          <option key={option} value={option}>
            {movieSightingsSortLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

type PageProps = {
  slug: string;
  sort: MovieSightingsSortOption;
  safePage: number;
  pageCount: number;
  totalCount: number;
  palette: boolean;
  placement?: "top" | "bottom";
};

export function MovieSightingsPagingBar({
  slug,
  sort,
  safePage,
  pageCount,
  totalCount,
  palette,
  placement = "top",
}: PageProps) {
  const from =
    totalCount === 0 ? 0 : (safePage - 1) * MOVIE_SIGHTINGS_PAGE_SIZE + 1;
  const to = Math.min(
    safePage * MOVIE_SIGHTINGS_PAGE_SIZE,
    totalCount,
  );

  if (totalCount === 0) return null;

  const isBottom = placement === "bottom";

  const navLandmarkLabel = isBottom
    ? "Sightings pagination (bottom)"
    : "Sightings pagination (top)";

  const prevEnabledSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_55%,rgb(253_251_246))] text-[color-mix(in_srgb,var(--movie-accent)_32%,rgb(44_38_35))] dark:border-[color-mix(in_srgb,var(--movie-accent)_34%,rgb(245_240_232/0.35))] dark:bg-[rgb(34_29_24)] dark:text-[color-mix(in_srgb,var(--movie-accent)_42%,rgb(245_240_232))]"
    : "border-stone-950/90 bg-white text-stone-950 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100";

  const nextEnabledSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_58%,rgb(62_45_30))] bg-[color-mix(in_srgb,var(--movie-accent)_82%,rgb(253_224_71))] text-stone-950 dark:border-[color-mix(in_srgb,var(--movie-accent)_45%,rgb(245_240_232/0.38))] dark:bg-[color-mix(in_srgb,var(--movie-accent)_52%,rgb(85_55_22))] dark:text-[color-mix(in_srgb,var(--movie-accent)_10%,rgb(255_252_244))]"
    : "border-stone-950/90 bg-[#fcd34d] text-stone-950 dark:border-amber-400/40 dark:bg-amber-700/80 dark:text-amber-50";

  const disabledSkin = palette
    ? "border-dashed border-[color-mix(in_srgb,var(--movie-accent)_24%,rgb(161_161_170))] text-[color-mix(in_srgb,var(--movie-accent)_20%,rgb(120_113_108))] dark:border-[color-mix(in_srgb,var(--movie-accent)_20%,rgb(113_113_122))] dark:text-[color-mix(in_srgb,var(--movie-accent)_18%,rgb(161_161_170))]"
    : "border-dashed border-stone-400 text-stone-400 dark:border-stone-600 dark:text-stone-500";

  const bottomDividerSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_26%,rgb(120_113_108/0.72))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(245_240_232/0.24))]"
    : "border-stone-900/22 dark:border-white/18";

  return (
    <div
      role="navigation"
      aria-label={navLandmarkLabel}
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        isBottom
          ? `mt-10 border-t pt-8 ${bottomDividerSkin}`
          : "mt-5 mb-6"
      }`}
    >
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
        Showing{" "}
        <span className="tabular-nums text-stone-950 dark:text-stone-50">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="tabular-nums text-stone-950 dark:text-stone-50">
          {totalCount}
        </span>
        {pageCount > 1 ? (
          <>
            {" "}
            · Page <span className="tabular-nums">{safePage}</span> / {pageCount}
          </>
        ) : null}
      </p>
      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {safePage > 1 ? (
            <Link
              prefetch={false}
              href={buildMovieSightingsPath(slug, {
                sort,
                page: safePage - 1,
              })}
              className={`wr-btn px-4 py-2 text-xs font-black uppercase tracking-wide hover:brightness-[0.98] ${prevEnabledSkin}`}
              scroll={false}
            >
              ← Previous
            </Link>
          ) : (
            <span
              className={`inline-flex rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide ${disabledSkin}`}
            >
              ← Previous
            </span>
          )}
          {safePage < pageCount ? (
            <Link
              prefetch={false}
              href={buildMovieSightingsPath(slug, {
                sort,
                page: safePage + 1,
              })}
              className={`wr-btn px-4 py-2 text-xs font-black uppercase tracking-wide hover:brightness-[0.98] ${nextEnabledSkin}`}
              scroll={false}
            >
              Next →
            </Link>
          ) : (
            <span
              className={`inline-flex rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide ${disabledSkin}`}
            >
              Next →
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
