"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const catalogSortOptions = [
  "latest-added-title",
  "latest-sighting",
  "most-rats-logged",
  "total-sightings",
] as const;
export type CatalogSortOption = (typeof catalogSortOptions)[number];
export type CatalogView = "list" | "card";

export const catalogSortLabels: Record<CatalogSortOption, string> = {
  "latest-added-title": "Latest Added Title",
  "latest-sighting": "Latest Sighting",
  "most-rats-logged": "Most Rats Logged",
  "total-sightings": "Total Sightings",
};

// Shared pending state so CatalogResultsWrapper can dim results while CatalogFilters navigates.
type PendingCtx = { isPending: boolean; startTransition: React.TransitionStartFunction };
const PendingContext = createContext<PendingCtx>({
  isPending: false,
  startTransition: (fn) => fn(),
});

export function CatalogPendingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <PendingContext.Provider value={{ isPending, startTransition }}>
      {children}
    </PendingContext.Provider>
  );
}

export function CatalogResultsWrapper({ children }: { children: React.ReactNode }) {
  const { isPending } = useContext(PendingContext);
  return (
    <div
      className={`relative mt-6 transition-opacity duration-150${isPending ? " pointer-events-none select-none opacity-40" : ""}`}
    >
      {children}
    </div>
  );
}

type Props = {
  availableGenres: string[];
  defaultQuery: string;
  defaultGenre: string;
  defaultSort: CatalogSortOption;
  defaultView: CatalogView;
  totalResults: number;
  totalCatalog: number;
};

export function CatalogFilters({
  availableGenres,
  defaultQuery,
  defaultGenre,
  defaultSort,
  defaultView,
  totalResults,
  totalCatalog,
}: Props) {
  const router = useRouter();
  const { isPending, startTransition } = useContext(PendingContext);
  const [query, setQuery] = useState(defaultQuery);
  const [genre, setGenre] = useState(defaultGenre);
  const [sort, setSort] = useState<CatalogSortOption>(defaultSort);
  const [view, setView] = useState<CatalogView>(defaultView);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when server re-renders with new URL params (back/forward navigation).
  // Skip query sync when a debounce is pending — user is mid-type and the settled URL
  // would overwrite whatever they're currently typing.
  useEffect(() => { if (!debounceRef.current) setQuery(defaultQuery); }, [defaultQuery]);
  useEffect(() => { setGenre(defaultGenre); }, [defaultGenre]);
  useEffect(() => { setSort(defaultSort); }, [defaultSort]);
  useEffect(() => { setView(defaultView); }, [defaultView]);

  const navigate = (q: string, g: string, s: CatalogSortOption, v: CatalogView) => {
    const urlParams = new URLSearchParams();
    if (q.trim()) urlParams.set("q", q.trim());
    if (g !== "all") urlParams.set("genre", g);
    if (s !== "latest-added-title") urlParams.set("sort", s);
    if (v !== "list") urlParams.set("view", v);
    const search = urlParams.toString();
    const href = search ? `/?${search}#catalog` : "/#catalog";
    startTransition(() => router.push(href, { scroll: false }));
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(value, genre, sort, view), 350);
  };

  const handleGenreChange = (value: string) => {
    setGenre(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(query, value, sort, view);
  };

  const handleSortChange = (value: CatalogSortOption) => {
    setSort(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(query, genre, value, view);
  };

  const handleViewChange = (value: CatalogView) => {
    setView(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(query, genre, sort, value);
  };

  const hasActiveFilters = genre !== "all" || sort !== "latest-added-title";
  const countLabel = totalResults === 1 ? "1 movie" : `${totalResults} movies`;
  const countSuffix = totalResults < totalCatalog ? ` of ${totalCatalog} total` : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_1fr] md:gap-3">
        <label className="col-span-2 flex flex-col gap-1 text-sm font-bold text-stone-800 md:col-span-1 md:gap-2 dark:text-stone-300">
          <span className="flex items-center gap-2">
            Search
            {isPending && (
              <svg
                className="animate-spin text-stone-400"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                navigate(query, genre, sort, view);
              }
            }}
            placeholder="Enter title or IMDb ID…"
            className="wr-input h-9 md:h-11"
            aria-label="Search movies by title or IMDb ID"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-stone-800 md:gap-2 dark:text-stone-300">
          Genre
          <select
            value={genre}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="wr-select h-9 md:h-11"
            disabled={isPending}
          >
            <option value="all">All genres</option>
            {availableGenres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-stone-800 md:gap-2 dark:text-stone-300">
          Sort by
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as CatalogSortOption)}
            className="wr-select h-9 md:h-11"
            disabled={isPending}
          >
            {catalogSortOptions.map((option) => (
              <option key={option} value={option}>
                {catalogSortLabels[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {genre !== "all" && (
            <button
              type="button"
              onClick={() => handleGenreChange("all")}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600"
            >
              {genre}
              <span aria-hidden="true" className="text-stone-400 dark:text-stone-400">×</span>
            </button>
          )}
          {sort !== "latest-added-title" && (
            <button
              type="button"
              onClick={() => handleSortChange("latest-added-title")}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600"
            >
              {catalogSortLabels[sort]}
              <span aria-hidden="true" className="text-stone-400 dark:text-stone-400">×</span>
            </button>
          )}
          {!hasActiveFilters && (
            <p className={`text-sm font-medium text-stone-500 transition-opacity dark:text-stone-500${isPending ? " opacity-50" : ""}`}>
              {countLabel}{countSuffix}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <p className={`text-sm font-medium text-stone-500 transition-opacity dark:text-stone-500${isPending ? " opacity-50" : ""}`}>
              {countLabel}{countSuffix}
            </p>
          )}
          <div className="flex gap-0.5 rounded-lg border border-stone-200 p-0.5 dark:border-stone-700">
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              title="List view"
              aria-pressed={view === "list"}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${view === "list" ? "bg-orange-600 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
              List
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("card")}
              title="Card view"
              aria-pressed={view === "card"}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${view === "card" ? "bg-orange-600 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
              </svg>
              Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type PaginationProps = {
  totalResults: number;
  currentPage: number;
  pageSize: number;
};

export function CatalogPagination({ totalResults, currentPage, pageSize }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalResults <= pageSize) return null;

  const totalPages = Math.ceil(totalResults / pageSize);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);

  const navigatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const search = params.toString();
    const href = search ? `/?${search}#catalog` : "/#catalog";
    startTransition(() => router.push(href, { scroll: false }));
  };

  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t-2 border-stone-950/10 pt-6 dark:border-white/10">
      <button
        type="button"
        onClick={() => navigatePage(currentPage - 1)}
        disabled={!hasPrev || isPending}
        className="wr-btn-ghost px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <p className="text-center text-sm font-semibold tabular-nums text-stone-600 dark:text-stone-400">
        Showing {rangeStart}–{rangeEnd} of {totalResults} movies
      </p>

      <button
        type="button"
        onClick={() => navigatePage(currentPage + 1)}
        disabled={!hasNext || isPending}
        className="wr-btn-ghost px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  );
}
