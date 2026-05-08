import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getApprovedSubmissionRatTally } from "@/lib/moderation-store";
import { getDeletedMovieIds } from "@/lib/movie-edit-store";
import { estimateRatsForAppearance } from "@/lib/whererat";
import {
  getCatalogGenres,
  getCatalogMovies,
  searchCatalogMovies,
  getCatalogStatsWithCommunity,
} from "@/lib/movie-catalog";
import { getMergedSightingsForMovie } from "@/lib/moderation-store";
import { CatalogFilters, CatalogPagination, type CatalogSortOption } from "./catalog-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Browse the WhereRat catalog of rat sightings in movies, with filters, stats, and spoiler-aware entries.",
  alternates: {
    canonical: "/",
  },
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCatalogSort(value: string | undefined): CatalogSortOption {
  if (
    value === "latest-added-title" ||
    value === "latest-sighting" ||
    value === "most-rats-logged" ||
    value === "total-sightings"
  ) {
    return value;
  }
  return "latest-added-title";
}

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const PAGE_SIZE = 12;
  const params = searchParams ? await searchParams : {};
  const query = single(params.q) ?? "";
  const genre = single(params.genre) ?? "all";
  const sort = parseCatalogSort(single(params.sort));
  const rawPage = parseInt(single(params.page) ?? "1", 10);
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const deletedMovieIds = await getDeletedMovieIds();
  const catalogMovies = await getCatalogMovies();
  const movieIndexById = new Map(catalogMovies.map((movie, index) => [movie.id, index]));
  const filteredResults = (await searchCatalogMovies({ query, genre })).filter(
    (movie) => !deletedMovieIds.has(movie.id),
  );
  const resultMetrics = await Promise.all(
    filteredResults.map(async (movie) => {
      const sightings = await getMergedSightingsForMovie(movie.id);
      const latestSightingMs = sightings.reduce((latest, sighting) => {
        const ms = sighting.submissionReviewedAtISO
          ? Date.parse(sighting.submissionReviewedAtISO)
          : 0;
        return Number.isFinite(ms) ? Math.max(latest, ms) : latest;
      }, 0);
      const ratsLogged = sightings.reduce(
        (sum, sighting) => sum + estimateRatsForAppearance(sighting),
        0,
      );
      return {
        movie,
        sightingCount: sightings.length,
        latestSightingMs,
        ratsLogged,
        catalogIndex: movieIndexById.get(movie.id) ?? 0,
      };
    }),
  );
  const sortedMetrics = [...resultMetrics].sort((a, b) => {
    if (sort === "latest-sighting") {
      if (b.latestSightingMs !== a.latestSightingMs) return b.latestSightingMs - a.latestSightingMs;
      return b.catalogIndex - a.catalogIndex;
    }
    if (sort === "most-rats-logged") {
      if (b.ratsLogged !== a.ratsLogged) return b.ratsLogged - a.ratsLogged;
      return b.sightingCount - a.sightingCount;
    }
    if (sort === "total-sightings") {
      if (b.sightingCount !== a.sightingCount) return b.sightingCount - a.sightingCount;
      return b.ratsLogged - a.ratsLogged;
    }
    return b.catalogIndex - a.catalogIndex;
  });
  const totalResults = sortedMetrics.length;
  const pageOffset = (currentPage - 1) * PAGE_SIZE;
  const pagedMetrics = sortedMetrics.slice(pageOffset, pageOffset + PAGE_SIZE);
  const results = pagedMetrics.map((item) => item.movie);
  const sightingCountByMovie = new Map(
    pagedMetrics.map((item) => [item.movie.id, item.sightingCount]),
  );
  const catalogFiltersActive =
    query.trim().length > 0 || genre !== "all";
  const stats = await getCatalogStatsWithCommunity();
  const approvedSubmissionRats = await getApprovedSubmissionRatTally();
  const ratsTallied = stats.ratsTallied + approvedSubmissionRats;
  const availableGenres = await getCatalogGenres();

  const statsBarItems = [
    {
      value: Math.max(0, stats.movies - deletedMovieIds.size),
      shortLabel: "Movies Cataloged",
      fullLabel: "Movies in collection",
      detailTitle: undefined as string | undefined,
    },
    {
      value: stats.sightings,
      shortLabel: "Total Sightings",
      fullLabel: "Sightings logged",
      detailTitle: undefined as string | undefined,
    },
    {
      value: ratsTallied,
      shortLabel: "Total Rats Logged (EST.)",
      fullLabel: "Rats tallied (est.)",
      detailTitle:
        "Catalog heuristic (swarms weigh more) plus submitter-rated counts from moderator-approved queue items.",
    },
  ];

  return (
    <main className="relative">
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1
            className="tracking-normal text-stone-950 dark:text-[#fff8ec]"
            style={{ fontFamily: "var(--font-hero)", fontSize: "clamp(1.5rem, 3.5vw, 3rem)" }}
          >
            An obsessive guide to{" "}
            <span className="inline-block -scale-x-100">🐀</span> on film.
          </h1>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-0 sm:px-6 sm:pb-0 lg:px-8">
        <div className="wr-cheese-stats-slab overflow-hidden rounded-2xl rounded-b-none border-2 border-stone-950 shadow-[4px_4px_0_0_rgb(28_25_23/0.28)] dark:border-amber-400/35 dark:shadow-[4px_4px_0_0_rgb(0_0_0/0.38)]">
          <div className="flex divide-x-2 divide-stone-950/20 dark:divide-white/15">
            {statsBarItems.map((item) => (
              <div
                key={item.fullLabel}
                title={item.detailTitle ?? item.fullLabel}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-3 py-3.5 sm:px-8 sm:py-4"
              >
                <p className="wr-display text-2xl font-black leading-none tracking-[0.02em] tabular-nums text-stone-950 dark:text-[#fff7dc] sm:text-3xl">
                  {item.value.toLocaleString()}
                </p>
                <p className="text-center text-[0.84rem] font-bold uppercase tracking-[0.13em] text-stone-800/90 dark:text-amber-200/90 sm:text-[0.9rem]">
                  {item.shortLabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section
        id="catalog"
        className="mx-auto max-w-7xl px-4 pt-0 pb-20 sm:px-6 sm:pt-0 lg:px-8 lg:pt-0"
      >
        <div className="wr-card rounded-t-none border-t-0 bg-[#fdfbf7]/95 p-4 sm:p-7 dark:border-white/14 dark:bg-[rgb(40_35_30/0.97)]">
          <CatalogFilters
            availableGenres={availableGenres}
            defaultQuery={query}
            defaultGenre={genre}
            defaultSort={sort}
          />

          {totalResults > 0 ? (
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {results.map((movie) => {
                const sightingCount = sightingCountByMovie.get(movie.id) ?? 0;

                return (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.slug}`}
                    className="group relative grid overflow-hidden rounded-2xl border-2 border-stone-950/90 bg-[var(--wr-surface-cream)] shadow-[3px_3px_0_0_rgb(28_25_23/0.72)] outline-none transition hover:border-stone-950 hover:bg-[var(--wr-card-bg)] focus-visible:ring-2 focus-visible:ring-amber-600/35 focus-visible:ring-offset-2 dark:border-white/14 dark:bg-stone-900/70 dark:shadow-[3px_3px_0_0_rgb(0_0_0/0.48)] dark:hover:border-amber-400/40 dark:hover:bg-stone-900/95 dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-stone-900 sm:grid-cols-[140px_1fr]"
                  >
                    <div className="relative min-h-48 overflow-hidden border-b-2 border-stone-950/90 bg-stone-900 sm:min-h-0 sm:border-r-2 sm:border-b-0 dark:border-white/14">
                      <Image
                        src={movie.posterUrl}
                        alt={movie.posterAlt}
                        width={280}
                        height={420}
                        className="h-full min-h-48 w-full scale-[1.04] object-cover transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-95 sm:min-h-full"
                      />
                      <span className="pointer-events-none absolute bottom-3 left-3 z-[1] max-w-[calc(100%-1.25rem)] truncate rounded-lg border-2 border-stone-950/90 bg-[color-mix(in_srgb,var(--wr-cheese)_92%,transparent)] px-2 py-0.5 text-left text-[0.65rem] font-bold whitespace-nowrap text-stone-950 tabular-nums shadow-[2px_2px_0_0_rgb(28_25_23/0.55)] backdrop-blur-[1px] sm:bottom-2.5 sm:left-2.5 sm:text-xs dark:border-white/20 dark:bg-[color-mix(in_srgb,var(--wr-cheese)_56%,rgb(41_37_33))] dark:text-stone-50 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.42)]">
                        {sightingCount} sighting
                        {sightingCount === 1 ? "" : "s"}
                      </span>
                      <div
                        className={`absolute inset-x-0 bottom-0 h-1.5 ${movie.posterTone}`}
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-3 p-4 sm:p-5">
                      <div className="min-w-0">
                        <h3 className="wr-display text-xl font-bold leading-snug tracking-tight text-stone-950 group-hover:text-stone-800 dark:text-stone-50 dark:group-hover:text-amber-50 sm:text-2xl">
                          {movie.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-stone-600 dark:text-stone-400">
                          {movie.releaseYear} · {movie.runtimeMinutes} min ·{" "}
                          {movie.metadata.rating}
                        </p>
                      </div>
                      <p className="line-clamp-2 text-sm leading-relaxed text-stone-700 dark:text-stone-400">
                        {movie.summary}
                      </p>
                      <p className="text-xs font-semibold text-stone-500 dark:text-stone-500">
                        {movie.genres.join(" · ")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {totalResults > 0 && (
            <CatalogPagination
              totalResults={totalResults}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
            />
          )}

          {totalResults === 0 ? (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-900/30 bg-orange-50/60 p-10 text-center dark:border-stone-600/50 dark:bg-orange-950/30">
              <p className="text-4xl">🧀</p>
              <h3 className="wr-display mt-4 text-2xl font-bold text-stone-950 dark:text-stone-100">
                No rats in this hole.
              </h3>
              <p className="mt-2 text-stone-700 dark:text-stone-400">
                Widen those filters—or submit a cheeky sighting so moderators can
                take a peek.
              </p>
              {catalogFiltersActive ? (
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/#catalog"
                    className="wr-btn-ghost px-6 py-2.5 text-sm font-bold"
                  >
                    Reset filters
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[var(--background)]"
      />
    </main>
  );
}
