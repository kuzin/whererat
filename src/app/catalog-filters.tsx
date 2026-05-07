"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const catalogSortOptions = [
  "latest-added-title",
  "latest-sighting",
  "most-rats-logged",
  "total-sightings",
] as const;
export type CatalogSortOption = (typeof catalogSortOptions)[number];

export const catalogSortLabels: Record<CatalogSortOption, string> = {
  "latest-added-title": "Latest Added Title",
  "latest-sighting": "Latest Sighting",
  "most-rats-logged": "Most Rats Logged",
  "total-sightings": "Total Sightings",
};

type Props = {
  availableGenres: string[];
  defaultQuery: string;
  defaultGenre: string;
  defaultSort: CatalogSortOption;
};

export function CatalogFilters({ availableGenres, defaultQuery, defaultGenre, defaultSort }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(defaultQuery);
  const [genre, setGenre] = useState(defaultGenre);
  const [sort, setSort] = useState<CatalogSortOption>(defaultSort);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when server re-renders with new URL params (back/forward navigation)
  useEffect(() => { setQuery(defaultQuery); }, [defaultQuery]);
  useEffect(() => { setGenre(defaultGenre); }, [defaultGenre]);
  useEffect(() => { setSort(defaultSort); }, [defaultSort]);

  const navigate = (q: string, g: string, s: CatalogSortOption) => {
    const urlParams = new URLSearchParams();
    if (q.trim()) urlParams.set("q", q.trim());
    if (g !== "all") urlParams.set("genre", g);
    if (s !== "latest-added-title") urlParams.set("sort", s);
    // page is intentionally omitted — filter changes reset to page 1
    const search = urlParams.toString();
    const href = search ? `/?${search}#catalog` : "/#catalog";
    startTransition(() => router.push(href, { scroll: false }));
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(value, genre, sort), 350);
  };

  const handleGenreChange = (value: string) => {
    setGenre(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(query, value, sort);
  };

  const handleSortChange = (value: CatalogSortOption) => {
    setSort(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(query, genre, value);
  };

  const handleDigIn = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(query, genre, sort);
  };

  return (
    <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-300">
        Search
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              navigate(query, genre, sort);
            }
          }}
          placeholder="Enter title or IMDb ID…"
          className={`wr-input h-11 transition-opacity duration-150${isPending ? " opacity-60" : ""}`}
          aria-label="Search movies by title or IMDb ID"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-300">
        Genre
        <select
          value={genre}
          onChange={(e) => handleGenreChange(e.target.value)}
          className="wr-select h-11"
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
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-300">
        Sort by
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as CatalogSortOption)}
          className="wr-select h-11"
          disabled={isPending}
        >
          {catalogSortOptions.map((option) => (
            <option key={option} value={option}>
              {catalogSortLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={handleDigIn}
        disabled={isPending}
        className="wr-btn-primary h-11 self-end whitespace-nowrap md:self-end"
      >
        Dig in
      </button>
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
