import { getMergedSightingsForMovie } from "@/lib/moderation-store";
import {
  applyMovieOverride,
  getDeletedMovieIds,
  getMovieOverride,
} from "@/lib/movie-edit-store";
import { getCatalogMovieBySlug } from "@/lib/movie-catalog";
import type { Movie, Sighting } from "@/lib/whererat";
import {
  parseMovieSightingsPageParam,
  parseMovieSightingsSortParam,
  prepareMovieSightingsView,
} from "@/lib/whererat";

export function serializeSightingPublic(sighting: Sighting) {
  return {
    id: sighting.id,
    movieId: sighting.movieId,
    timestamp: sighting.timestamp,
    title: sighting.title,
    description: sighting.description,
    prominence: sighting.prominence,
    sceneType: sighting.sceneType,
    spoiler: sighting.spoiler,
    approximateRatCount: sighting.approximateRatCount,
    images: sighting.images,
    imageUrl: sighting.imageUrl,
    imageAlt: sighting.imageAlt,
    submitterName: sighting.submitterName,
    submissionReviewedAtISO: sighting.submissionReviewedAtISO,
    curatorNote: sighting.curatorNote,
    confidence: sighting.confidence,
    verificationState: sighting.verificationState,
    verifiedBy: sighting.verifiedBy,
    sourceIds: sighting.sourceIds,
  };
}

export function serializeMoviePublic(movie: Movie) {
  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    genres: movie.genres,
    posterTone: movie.posterTone,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    posterAlt: movie.posterAlt,
    summary: movie.summary,
    externalIds: movie.externalIds,
    metadata: movie.metadata,
  };
}

export async function getV1MovieDetailJson(
  slug: string,
  sightingsQuery: { sort?: string | null; page?: string | null },
) {
  const base = await getCatalogMovieBySlug(slug);
  if (!base) return null;

  const deletedMovieIds = await getDeletedMovieIds();
  if (deletedMovieIds.has(base.id)) return null;

  const movieOverride = await getMovieOverride(base.id);
  const movie = applyMovieOverride(base, movieOverride);
  const sightings = await getMergedSightingsForMovie(movie.id);

  const sort = parseMovieSightingsSortParam(sightingsQuery.sort ?? undefined);
  const page = parseMovieSightingsPageParam(sightingsQuery.page ?? undefined);

  const view = prepareMovieSightingsView({
    items: sightings,
    sort,
    page,
    runtimeMinutes: movie.runtimeMinutes,
  });

  const m = serializeMoviePublic(movie);

  return {
    version: 1 as const,
    movie: m,
    featuredRats: {
      sort,
      sortLabels: {
        newest: "Latest submission",
        rats: "Most rats (est.)",
        "appearance-early": "Earliest in film",
        "appearance-late": "Latest in film",
      },
      page: view.safePage,
      pageCount: view.pageCount,
      totalCount: view.totalCount,
      sightings: view.pageSlice.map(serializeSightingPublic),
    },
    tabs: {
      facts: m.metadata.ratFacts ?? [],
      reviews: m.metadata.imdbReviews ?? [],
      related: m.metadata.imdbRelated ?? [],
      videos: m.metadata.imdbVideos ?? [],
      images: m.metadata.imdbImages ?? [],
    },
    links: {
      imdbTitle: `https://www.imdb.com/title/${m.externalIds.imdb}/`,
    },
  };
}
