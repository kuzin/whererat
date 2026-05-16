"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";

type MovieResult = {
  title: string;
  year: string;
  yearRange?: string;
  imdbId: string;
  kind: "movie" | "series";
  posterUrl: string;
  runtime?: string;
  genre?: string;
  rating?: string;
  imdbRating?: string;
  plot?: string;
  source: "OMDb" | "Seed";
  totalSeasons?: number;
  totalEpisodes?: number;
};

type SearchResponse = {
  configured: boolean;
  error?: string;
  results: MovieResult[];
  hasMore?: boolean;
  page?: number;
};

type EpisodeResult = { number: number; title: string };
type EpisodeLookupResponse = {
  ok: boolean;
  totalSeasons?: number;
  episodes?: EpisodeResult[];
  error?: string;
};

function PosterFallback({ title, className }: { title: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={title}
      className={`flex h-full w-full items-center justify-center bg-stone-200/75 dark:bg-stone-800/75${className ? ` ${className}` : ""}`}
    >
      <div className="relative h-full w-full rounded-md bg-stone-300/80 dark:bg-stone-700/80">
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-stone-500/70 dark:text-stone-300/65"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <circle cx="9" cy="10" r="1.4" />
          <path d="m6.8 16 4.4-4.2 3.2 3.2 2.8-2.7 1.8 1.7" />
          <path d="M6 18 18 6" />
        </svg>
      </div>
    </div>
  );
}

function MoviePoster({
  src,
  alt,
  width,
  height,
  className,
  title,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  title: string;
}) {
  const [failed, setFailed] = useState(!src || src === "N/A");

  if (failed) {
    return <PosterFallback title={`${title} poster unavailable`} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function formatImdbStars(value: string | undefined) {
  const n = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return "IMDb rating unavailable";
  return `★ ${n.toFixed(1)} IMDb`;
}

function formatMovieMetaLine(movie: MovieResult): string {
  if (movie.kind === "series") {
    const parts = [
      movie.yearRange || movie.year,
      movie.totalSeasons
        ? `${movie.totalSeasons} ${movie.totalSeasons === 1 ? "season" : "seasons"}`
        : undefined,
      movie.totalEpisodes
        ? `${movie.totalEpisodes} ${movie.totalEpisodes === 1 ? "episode" : "episodes"}`
        : undefined,
      movie.rating || "Rating TBD",
    ].filter(Boolean);
    return parts.join(" · ");
  }
  return `${movie.year} · ${movie.runtime ?? "Runtime TBD"} · ${movie.rating ?? "Rating TBD"}`;
}

export function MovieSearchField({
  fieldErrors = {},
  initialMovie,
  onKindChange,
  onMovieSelect,
}: {
  fieldErrors?: Record<string, string>;
  initialMovie?: MovieResult;
  onKindChange?: (kind: "movie" | "series" | undefined) => void;
  onMovieSelect?: (movie: MovieResult | undefined) => void;
}) {
  const [query, setQuery] = useState(
    initialMovie ? `${initialMovie.title} (${initialMovie.year})` : "",
  );
  const [results, setResults] = useState<MovieResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieResult | undefined>(initialMovie);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodes, setEpisodes] = useState<EpisodeResult[]>([]);
  const [seasonLookupError, setSeasonLookupError] = useState<string | undefined>();
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);
  const helperId = useId();

  const handleSelectMovie = (movie: MovieResult | undefined) => {
    setSelectedMovie(movie);
    onMovieSelect?.(movie);
  };

  const canSearch = query.trim().length >= 2;
  const visibleResults = canSearch && !selectedMovie ? results : [];
  const visibleError = canSearch && !selectedMovie ? error : undefined;
  const helperText = useMemo(() => {
    if (!canSearch) {
      return "Type at least two characters to search IMDb titles.";
    }

    if (!isConfigured) {
      return "OMDb is not configured, so this is searching the local seed catalog.";
    }

    return "Search is powered by OMDb and resolves the IMDb ID automatically.";
  }, [canSearch, isConfigured]);

  const isSeries = selectedMovie?.kind === "series";

  useEffect(() => {
    onKindChange?.(selectedMovie?.kind);
  }, [onKindChange, selectedMovie?.kind]);
  const seasonFieldError = fieldErrors.seasonNumber;
  const episodeFieldError = fieldErrors.episodeNumber;
  const seasonOptions = useMemo(() => {
    const total = selectedMovie?.totalSeasons ?? 0;
    if (!isSeries || !Number.isFinite(total) || total < 1) return [];
    return Array.from({ length: total }, (_, i) => String(i + 1));
  }, [isSeries, selectedMovie?.totalSeasons]);

  useEffect(() => {
    if (!canSearch || selectedMovie) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(undefined);
      setCurrentPage(1);
      setHasMore(false);

      try {
        const response = await fetch(
          `/api/movies/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as SearchResponse;

        setIsConfigured(payload.configured);
        setResults(payload.results);
        setError(payload.error);
        setHasMore(payload.hasMore ?? false);
        setCurrentPage(payload.page ?? 1);
      } catch {
        if (!controller.signal.aborted) {
          setError("Movie search is unavailable right now.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [canSearch, query, selectedMovie]);

  async function loadMore() {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(query)}&page=${nextPage}`,
      );
      const payload = (await response.json()) as SearchResponse;
      setResults((prev) => [...prev, ...payload.results]);
      setHasMore(payload.hasMore ?? false);
      setCurrentPage(payload.page ?? nextPage);
    } catch {
      // silently fail — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!isSeries || !selectedMovie?.imdbId || !seasonNumber) {
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      setIsEpisodeLoading(true);
      setSeasonLookupError(undefined);
      try {
        const response = await fetch(
          `/api/movies/episodes?imdbId=${encodeURIComponent(selectedMovie.imdbId)}&season=${encodeURIComponent(seasonNumber)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as EpisodeLookupResponse;
        if (!controller.signal.aborted) {
          if (!response.ok || !payload.ok) {
            setEpisodes([]);
            setSeasonLookupError(payload.error ?? "Could not load episode list.");
            return;
          }
          const nextEpisodes = payload.episodes ?? [];
          setEpisodes(nextEpisodes);
          if (nextEpisodes.length > 0) {
            const hasSelected = nextEpisodes.some((e) => String(e.number) === episodeNumber);
            if (!hasSelected) {
              setEpisodeNumber("");
              setEpisodeTitle("");
            } else {
              const match = nextEpisodes.find((e) => String(e.number) === episodeNumber);
              setEpisodeTitle(match?.title ?? "");
            }
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setEpisodes([]);
          setSeasonLookupError("Could not load episode list.");
        }
      } finally {
        if (!controller.signal.aborted) setIsEpisodeLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [isSeries, selectedMovie?.imdbId, seasonNumber, episodeNumber]);

  return (
    <div className="flex flex-col gap-4">
      {selectedMovie ? null : (
        <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          <span>
            Movie
            <span aria-hidden className="ml-1 text-red-600 dark:text-red-400">
              *
            </span>
          </span>
          <input
            data-field="movieSelection"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              handleSelectMovie(undefined);
              setError(undefined);
            }}
            placeholder="Start typing: The Departed, Ratatouille..."
            aria-invalid={Boolean(fieldErrors.movieSelection)}
            aria-describedby={helperId}
            className={`wr-input ${fieldErrors.movieSelection
                ? "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400"
                : ""
              }`}
          />
          {fieldErrors.movieSelection ? (
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {fieldErrors.movieSelection}
            </span>
          ) : null}
          <p
            id={helperId}
            className="text-xs font-medium text-stone-500 dark:text-stone-400"
          >
            {helperText}
          </p>
        </label>
      )}

      <input name="movieTitle" type="hidden" value={selectedMovie?.title ?? ""} />
      <input name="movieYear" type="hidden" value={selectedMovie?.year ?? ""} />
      <input name="imdbId" type="hidden" value={selectedMovie?.imdbId ?? ""} />
      <input name="imdbKind" type="hidden" value={selectedMovie?.kind ?? ""} />
      <input
        name="moviePosterUrl"
        type="hidden"
        value={selectedMovie?.posterUrl ?? ""}
      />
      <input name="seasonNumber" type="hidden" value={isSeries ? seasonNumber : ""} />
      <input name="episodeNumber" type="hidden" value={isSeries ? episodeNumber : ""} />
      <input name="episodeTitle" type="hidden" value={isSeries ? episodeTitle : ""} />

      {isLoading ? (
        <div className="rounded-xl border border-amber-700/35 bg-[#fef3c7] p-4 text-sm font-semibold text-amber-950">
          Searching movie titles...
        </div>
      ) : null}

      {visibleError ? (
        <div className="rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm font-semibold text-red-950">
          ⚠️ {visibleError}
        </div>
      ) : null}

      {selectedMovie ? (
        <div className="grid overflow-hidden rounded-xl border-2 border-amber-600/35 bg-amber-50/60 shadow-sm sm:grid-cols-[110px_1fr] dark:border-amber-500/30 dark:bg-amber-950/25">
          <MoviePoster
            src={selectedMovie.posterUrl}
            alt={`${selectedMovie.title} poster`}
            width={220}
            height={330}
            className="h-full w-full object-cover"
            title={selectedMovie.title}
          />
          <div className="flex flex-col justify-center p-4 sm:p-5">
            <p className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-50">
              {selectedMovie.title}
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-600 dark:text-stone-300">
              {formatMovieMetaLine(selectedMovie)}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-800 dark:text-amber-300">
              {formatImdbStars(selectedMovie.imdbRating)}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  handleSelectMovie(undefined);
                  setQuery("");
                  setSeasonNumber("");
                  setEpisodeNumber("");
                  setEpisodeTitle("");
                  setEpisodes([]);
                  setSeasonLookupError(undefined);
                }}
                className="wr-btn-ghost h-9 px-3 text-xs font-bold"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSeries ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
            <span>
              Season
              <span aria-hidden className="ml-1 text-red-600 dark:text-red-400">
                *
              </span>
            </span>
            {seasonOptions.length > 0 ? (
              <select
                data-field="seasonNumber"
                required
                value={seasonNumber}
                onChange={(event) => {
                  setSeasonNumber(event.currentTarget.value);
                  setEpisodeNumber("");
                  setEpisodeTitle("");
                  setEpisodes([]);
                  setSeasonLookupError(undefined);
                }}
                className={`wr-select ${seasonFieldError ? "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400" : ""}`}
              >
                <option value="">Select season</option>
                {seasonOptions.map((season) => (
                  <option key={season} value={season}>
                    Season {season}
                  </option>
                ))}
              </select>
            ) : (
              <input
                data-field="seasonNumber"
                type="number"
                required
                min={1}
                step={1}
                value={seasonNumber}
                onChange={(event) => {
                  setSeasonNumber(event.currentTarget.value);
                  setEpisodeNumber("");
                  setEpisodeTitle("");
                  setEpisodes([]);
                  setSeasonLookupError(undefined);
                }}
                className={`wr-input ${seasonFieldError ? "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400" : ""}`}
              />
            )}
            {seasonFieldError ? (
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                {seasonFieldError}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
            <span>
              Episode
              <span aria-hidden className="ml-1 text-red-600 dark:text-red-400">
                *
              </span>
            </span>
            {episodes.length > 0 ? (
              <select
                data-field="episodeNumber"
                required
                disabled={!seasonNumber}
                value={episodeNumber}
                onChange={(event) => {
                  const next = event.currentTarget.value;
                  setEpisodeNumber(next);
                  const match = episodes.find((e) => String(e.number) === next);
                  if (match) setEpisodeTitle(match.title);
                }}
                className={`wr-select ${!seasonNumber ? "cursor-not-allowed opacity-60" : ""} ${episodeFieldError ? "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400" : ""}`}
              >
                <option value="">Select episode</option>
                {episodes.map((ep) => (
                  <option key={ep.number} value={String(ep.number)}>
                    {`E${ep.number}${ep.title ? ` · ${ep.title}` : ""}`}
                  </option>
                ))}
              </select>
            ) : (
              <input
                data-field="episodeNumber"
                type="number"
                required
                disabled={!seasonNumber}
                min={1}
                step={1}
                value={episodeNumber}
                onChange={(event) => setEpisodeNumber(event.currentTarget.value)}
                className={`wr-input ${!seasonNumber ? "cursor-not-allowed opacity-60" : ""} ${episodeFieldError ? "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400" : ""}`}
              />
            )}
            {episodeFieldError ? (
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                {episodeFieldError}
              </span>
            ) : null}
            {isEpisodeLoading ? (
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Loading episodes…
              </span>
            ) : null}
            {seasonLookupError ? (
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {seasonLookupError}
              </span>
            ) : null}
            {episodes.length === 0 && !isEpisodeLoading && seasonNumber ? (
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Episode list unavailable — enter episode number manually.
              </span>
            ) : null}
          </label>
        </div>
      ) : null}

      {visibleResults.length > 0 ? (
        <div className="grid gap-3">
          {visibleResults.map((movie) => (
            <article
              key={movie.imdbId}
              className="grid grid-cols-[80px_1fr] overflow-hidden rounded-xl border-2 border-stone-950/22 bg-[var(--wr-card-bg)] transition-colors hover:bg-amber-50/40 dark:border-white/20 dark:hover:bg-stone-800/85 sm:grid-cols-[90px_1fr_auto]"
            >
              <MoviePoster
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                width={180}
                height={270}
                className="row-span-2 h-full min-h-[130px] w-full object-cover sm:row-span-1 sm:min-h-[135px]"
                title={movie.title}
              />
              <div className="flex min-w-0 flex-col justify-center px-4 py-4 sm:px-6">
                <p className="block text-base font-black text-stone-950 dark:text-stone-100 sm:text-lg">
                  {movie.title}
                </p>
                <p className="mt-1 block text-sm font-semibold text-stone-600 dark:text-stone-300">
                  {formatMovieMetaLine(movie)}
                </p>
                <p className="mt-1.5 block text-xs font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">
                  {formatImdbStars(movie.imdbRating)}
                </p>
              </div>
              <div className="flex items-center px-4 pb-4 sm:justify-end sm:px-5 sm:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMovie(movie);
                    setQuery(`${movie.title} (${movie.year})`);
                    setError(undefined);
                    setSeasonNumber("");
                    setEpisodeNumber("");
                    setEpisodeTitle("");
                    setEpisodes([]);
                    setSeasonLookupError(undefined);
                  }}
                  className="wr-btn-primary h-10 w-full px-4 text-xs font-bold sm:w-auto"
                  aria-label={`Select ${movie.kind === "series" ? "show" : "movie"} ${movie.title}`}
                >
                  {movie.kind === "series" ? "Select show" : "Select movie"}
                </button>
              </div>
            </article>
          ))}
          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="wr-btn-ghost w-full py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {isLoadingMore ? "Loading…" : "Show more results"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
