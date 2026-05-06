"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";

type MovieResult = {
  title: string;
  year: string;
  imdbId: string;
  posterUrl: string;
  runtime?: string;
  genre?: string;
  rating?: string;
  plot?: string;
  source: "OMDb" | "Seed";
};

type SearchResponse = {
  configured: boolean;
  error?: string;
  results: MovieResult[];
};

function PosterFallback({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-stone-200/75 p-3 text-center dark:bg-stone-800/75">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-700 dark:text-stone-300">
        {title}
      </span>
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
    return <PosterFallback title={`${title} poster unavailable`} />;
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

export function MovieSearchField({
  fieldErrors = {},
}: {
  fieldErrors?: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieResult | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const helperId = useId();

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

  useEffect(() => {
    if (!canSearch || selectedMovie) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await fetch(
          `/api/movies/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as SearchResponse;

        setIsConfigured(payload.configured);
        setResults(payload.results);
        setError(payload.error);
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

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
        IMDb title search
        <input
          data-field="movieSelection"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedMovie(undefined);
            setError(undefined);
          }}
          placeholder="Start typing: The Departed, Ratatouille..."
          aria-invalid={Boolean(fieldErrors.movieSelection)}
          aria-describedby={helperId}
          className={`wr-input ${
            fieldErrors.movieSelection
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

      <input name="movieTitle" type="hidden" value={selectedMovie?.title ?? ""} />
      <input name="movieYear" type="hidden" value={selectedMovie?.year ?? ""} />
      <input name="imdbId" type="hidden" value={selectedMovie?.imdbId ?? ""} />
      <input
        name="moviePosterUrl"
        type="hidden"
        value={selectedMovie?.posterUrl ?? ""}
      />

      {isLoading ? (
        <div className="rounded-xl border border-amber-700/35 bg-[#fef3c7] p-4 text-sm font-semibold text-amber-950">
          Searching movie titles...
        </div>
      ) : null}

      {visibleError ? (
        <div className="rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm font-semibold text-red-950">
          {visibleError}
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
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-900/80 dark:text-amber-200/90">
              Selected IMDb title
            </p>
            <p className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-50">
              {selectedMovie.title}
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-600 dark:text-stone-300">
              {selectedMovie.year} · {selectedMovie.runtime ?? "Runtime TBD"} ·{" "}
              {selectedMovie.rating ?? "Rating TBD"}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-800 dark:text-amber-300">
              IMDb {selectedMovie.imdbId} · {selectedMovie.source}
            </p>
          </div>
        </div>
      ) : null}

      {visibleResults.length > 0 ? (
        <div className="grid gap-3">
          {visibleResults.map((movie) => (
            <button
              key={movie.imdbId}
              type="button"
              onClick={() => {
                setSelectedMovie(movie);
                setQuery(`${movie.title} (${movie.year})`);
                setError(undefined);
              }}
              className="grid overflow-hidden rounded-xl border-2 border-stone-950/85 bg-[var(--wr-card-bg)] text-left transition-colors hover:bg-amber-50/40 dark:border-white/14 dark:hover:bg-stone-800/85 sm:grid-cols-[90px_1fr]"
            >
              <MoviePoster
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                width={180}
                height={270}
                className="h-[135px] w-full object-cover sm:h-full sm:min-h-[135px]"
                title={movie.title}
              />
              <span className="flex flex-col justify-center px-5 py-4 sm:px-6">
                <span className="block text-lg font-black text-stone-950 dark:text-stone-100">
                  {movie.title}
                </span>
                <span className="mt-1 block text-sm font-semibold text-stone-600 dark:text-stone-300">
                  {movie.year} · {movie.runtime ?? "Runtime TBD"} ·{" "}
                  {movie.rating ?? "Rating TBD"}
                </span>
                <span className="mt-2 block text-xs font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">
                  IMDb {movie.imdbId} · {movie.source}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
