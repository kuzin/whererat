"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (g !== "all") params.set("genre", g);
    if (s !== "latest-added-title") params.set("sort", s);
    const search = params.toString();
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
