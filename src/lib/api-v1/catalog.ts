import { getDeletedMovieIds } from "@/lib/movie-edit-store";
import {
  getCatalogGenres,
  getCatalogMovies,
  searchCatalogMovies,
} from "@/lib/movie-catalog";
import { getMergedSightingsForMovie } from "@/lib/moderation-store";
import { estimateRatsForAppearance } from "@/lib/whererat";

export const V1_CATALOG_PAGE_DEFAULT = 12;
export const V1_CATALOG_PAGE_MAX = 50;

export type V1CatalogSort =
  | "latest-added-title"
  | "latest-sighting"
  | "most-rats-logged"
  | "total-sightings";

export function parseV1CatalogSort(value: string | null | undefined): V1CatalogSort {
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

export function parseV1Page(value: string | null | undefined, fallback = 1): number {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

export function clampV1PageSize(value: number): number {
  if (!Number.isFinite(value)) return V1_CATALOG_PAGE_DEFAULT;
  return Math.min(V1_CATALOG_PAGE_MAX, Math.max(1, Math.floor(value)));
}

export async function getV1CatalogJson(input: {
  query: string;
  genre: string;
  sort: V1CatalogSort;
  page: number;
  pageSize: number;
}) {
  const { query, genre, sort } = input;
  const pageSize = clampV1PageSize(input.pageSize);
  const currentPage = parseV1Page(String(input.page), 1);

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
  const pageOffset = (currentPage - 1) * pageSize;
  const pagedMetrics = sortedMetrics.slice(pageOffset, pageOffset + pageSize);
  const genres = await getCatalogGenres();

  return {
    version: 1 as const,
    genres,
    sort,
    filters: {
      q: query,
      genre: genre || "all",
    },
    page: currentPage,
    pageSize,
    total: totalResults,
    pageCount: Math.max(1, Math.ceil(totalResults / pageSize)),
    movies: pagedMetrics.map(({ movie, sightingCount }) => ({
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      releaseYear: movie.releaseYear,
      runtimeMinutes: movie.runtimeMinutes,
      genres: movie.genres,
      posterUrl: movie.posterUrl,
      posterAlt: movie.posterAlt,
      posterTone: movie.posterTone,
      summary: movie.summary,
      sightingCount,
      rating: movie.metadata.rating,
      imdbRating: movie.metadata.imdbRating,
      imdbVotes: movie.metadata.imdbVotes,
    })),
  };
}
