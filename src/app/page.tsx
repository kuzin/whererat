import Image from "next/image";
import Link from "next/link";
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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectChevronUrl(stroke: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 8 4 4 4-4"/></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

const catalogSortOptions = [
  "latest-added-title",
  "latest-sighting",
  "most-rats-logged",
  "total-sightings",
] as const;
type CatalogSortOption = (typeof catalogSortOptions)[number];

const catalogSortLabels: Record<CatalogSortOption, string> = {
  "latest-added-title": "Latest added title",
  "latest-sighting": "Latest sighting",
  "most-rats-logged": "Most rats logged",
  "total-sightings": "Total sightings",
};

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
  const params = searchParams ? await searchParams : {};
  const query = single(params.q) ?? "";
  const genre = single(params.genre) ?? "all";
  const sort = parseCatalogSort(single(params.sort));
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
  const results = sortedMetrics.map((item) => item.movie);
  const sightingCountByMovie = new Map(
    sortedMetrics.map((item) => [item.movie.id, item.sightingCount]),
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
    <main className="wr-cheese-tile-cream">
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="wr-display mx-auto max-w-[18ch] text-[2.125rem] font-bold leading-[1.06] tracking-tight text-stone-950 sm:max-w-none sm:text-5xl lg:text-[3.25rem] dark:text-[#fff8ec]">
              Movie rats{" "}
              <span className="relative whitespace-nowrap text-[#ea580c] dark:text-[#fdba74]">
                clocked to the second
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-1.5 skew-x-[-8deg] rounded-sm bg-[#fde047]/90 dark:bg-amber-500/85"
                />
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed font-medium text-stone-700 sm:max-w-3xl sm:text-xl dark:text-stone-300">
              A living archive of cinematic rats, built by people who actually
              notice them.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3 sm:mt-12">
              <Link
                href="/submit"
                className="wr-display inline-flex min-h-[3.5rem] min-w-[13rem] items-center justify-center rounded-3xl border-[3px] border-stone-950 bg-[#fca5a5] px-10 py-4 text-center text-xl font-bold text-stone-950 shadow-[6px_6px_0_0_rgb(28_25_23/0.88)] outline-none transition hover:brightness-[1.04] focus-visible:ring-2 focus-visible:ring-orange-600/60 focus-visible:ring-offset-2 active:translate-y-[2px] active:shadow-none sm:min-h-[4rem] sm:min-w-[15rem] sm:px-12 sm:py-5 sm:text-2xl dark:border-white/88 dark:bg-[#f97316] dark:text-stone-950 dark:shadow-[6px_6px_0_0_rgb(0_0_0/0.55)]"
              >
                Submit a Sighting
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-2 pb-0 sm:px-6 sm:pt-3 sm:pb-0 lg:px-8">
        <div className="overflow-hidden rounded-2xl rounded-b-none border-2 border-stone-950 bg-gradient-to-r from-[#fde047] via-[#fcd34d] to-[#fbbf24] shadow-[4px_4px_0_0_rgb(28_25_23/0.28)] dark:border-amber-400/35 dark:from-[#5c370d] dark:via-[#713f12] dark:to-[#5c370d] dark:shadow-[4px_4px_0_0_rgb(0_0_0/0.38)]">
          <div className="flex divide-x-2 divide-stone-950/20 dark:divide-white/15">
            {statsBarItems.map((item) => (
              <div
                key={item.fullLabel}
                title={item.detailTitle ?? item.fullLabel}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-3 py-3.5 sm:px-8 sm:py-4"
              >
                <p className="wr-display text-2xl font-black leading-none tabular-nums text-stone-950 dark:text-[#fff7dc] sm:text-3xl">
                  {item.value}
                </p>
                <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone-800/85 dark:text-amber-200/85 sm:text-[0.7rem]">
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
        <div className="wr-card rounded-t-none bg-[#fdfbf7]/95 p-4 sm:p-7 dark:border-white/14 dark:bg-[rgb(40_35_30/0.97)]">
          <form className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-300">
              Search for title or note
              <input
                name="q"
                defaultValue={query}
                placeholder="Enter title, IMDb ID, or note…"
                className="wr-input h-11"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold text-stone-800 dark:text-stone-300">
              Genre
              <select
                name="genre"
                defaultValue={genre}
                className="wr-input h-11 appearance-none bg-[length:1.125rem_1.125rem] bg-[position:right_0.875rem_center] bg-no-repeat py-2 pl-4 pr-12 [background-image:var(--wr-select-chevron)] dark:[background-image:var(--wr-select-chevron-dark)]"
                style={
                  {
                    "--wr-select-chevron": selectChevronUrl("#57534e"),
                    "--wr-select-chevron-dark": selectChevronUrl("#d6d3d1"),
                  } as Record<string, string>
                }
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
                name="sort"
                defaultValue={sort}
                className="wr-input h-11 appearance-none bg-[length:1.125rem_1.125rem] bg-[position:right_0.875rem_center] bg-no-repeat py-2 pl-4 pr-12 [background-image:var(--wr-select-chevron)] dark:[background-image:var(--wr-select-chevron-dark)]"
                style={
                  {
                    "--wr-select-chevron": selectChevronUrl("#57534e"),
                    "--wr-select-chevron-dark": selectChevronUrl("#d6d3d1"),
                  } as Record<string, string>
                }
              >
                {catalogSortOptions.map((option) => (
                  <option key={option} value={option}>
                    {catalogSortLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="wr-btn h-11 self-end whitespace-nowrap bg-[#fb923c] text-stone-950 md:self-end"
            >
              Dig in
            </button>
          </form>

          {results.length > 0 ? (
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {results.map((movie) => {
                const sightingCount = sightingCountByMovie.get(movie.id) ?? 0;

                return (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.slug}`}
                    className="group relative grid overflow-hidden rounded-2xl border-2 border-stone-950/90 bg-[#fffaf5] shadow-[3px_3px_0_0_rgb(28_25_23/0.72)] outline-none transition hover:border-stone-950 hover:bg-[#fef3e2] focus-visible:ring-2 focus-visible:ring-amber-600/35 focus-visible:ring-offset-2 dark:border-white/14 dark:bg-stone-900/70 dark:shadow-[3px_3px_0_0_rgb(0_0_0/0.48)] dark:hover:border-amber-400/40 dark:hover:bg-stone-900/95 dark:focus-visible:ring-amber-400/40 dark:focus-visible:ring-offset-stone-900 sm:grid-cols-[140px_1fr]"
                  >
                    <div className="relative min-h-48 overflow-hidden border-b-2 border-stone-950/90 bg-stone-900 sm:min-h-0 sm:border-r-2 sm:border-b-0 dark:border-white/14">
                      <Image
                        src={movie.posterUrl}
                        alt={movie.posterAlt}
                        width={280}
                        height={420}
                        className="h-full min-h-48 w-full scale-[1.04] object-cover transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-95 sm:min-h-full"
                      />
                      <span className="pointer-events-none absolute bottom-3 left-3 z-[1] max-w-[calc(100%-1.25rem)] truncate rounded-lg border-2 border-stone-950/90 bg-[#fcd34d]/95 px-2 py-0.5 text-left text-[0.65rem] font-bold whitespace-nowrap text-stone-950 tabular-nums shadow-[2px_2px_0_0_rgb(28_25_23/0.55)] backdrop-blur-[1px] sm:bottom-2.5 sm:left-2.5 sm:text-xs dark:border-white/20 dark:bg-[#b8982a]/95 dark:text-stone-50 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.42)]">
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
          ) : (
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
          )}
        </div>
      </section>
    </main>
  );
}
