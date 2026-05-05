import { normalizeImdbId, type Movie } from "@/lib/whererat";
import { getDbPool } from "@/lib/db";

const FALLBACK_POSTER = "https://placehold.co/600x900/292524/fef3c7/png?text=Community+Movie";
const FALLBACK_BACKDROP =
  "https://placehold.co/1200x600/292524/fef3c7/png?text=Community+Movie";

type MovieRow = {
  id: string;
  slug: string;
  title: string;
  release_year: number;
  runtime_minutes: number;
  genres: string[];
  poster_tone: string;
  poster_url: string;
  backdrop_url: string;
  poster_alt: string;
  imdb_id: string;
  tmdb_id: string | null;
  summary: string;
  metadata: Movie["metadata"];
};

function normalizeImageUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim() ?? "";
  if (!raw) return fallback;
  if (raw.startsWith("/")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return fallback;
}

export async function getCatalogMovies(): Promise<Movie[]> {
  const pool = getDbPool();
  const result = await pool.query<MovieRow>(
    `select id, slug, title, release_year, runtime_minutes, genres, poster_tone, poster_url, backdrop_url, poster_alt, imdb_id, tmdb_id, summary, metadata
     from movies
     where is_deleted = false
     order by created_at asc`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    releaseYear: row.release_year,
    runtimeMinutes: row.runtime_minutes,
    genres: row.genres,
    posterTone: row.poster_tone,
    posterUrl: normalizeImageUrl(row.poster_url, FALLBACK_POSTER),
    backdropUrl: normalizeImageUrl(row.backdrop_url, FALLBACK_BACKDROP),
    posterAlt: row.poster_alt,
    externalIds: {
      imdb: row.imdb_id,
      tmdb: row.tmdb_id ?? undefined,
    },
    summary: row.summary,
    metadata: row.metadata,
  })).map((movie) => ({
    ...movie,
    posterUrl: normalizeImageUrl(movie.posterUrl, FALLBACK_POSTER),
    backdropUrl: normalizeImageUrl(movie.backdropUrl, FALLBACK_BACKDROP),
  }));
}

export async function getCatalogMovieBySlug(slug: string) {
  const allMovies = await getCatalogMovies();
  return allMovies.find((movie) => movie.slug === slug);
}

export async function getCatalogMovieByImdbId(imdbIdOrUrl: string) {
  const imdbId = normalizeImdbId(imdbIdOrUrl);
  if (!imdbId) return undefined;
  const allMovies = await getCatalogMovies();
  return allMovies.find((movie) => movie.externalIds.imdb === imdbId);
}

export async function getCatalogMovieByTitleSearch(title: string) {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) return undefined;
  const allMovies = await getCatalogMovies();
  return allMovies.find((movie) => {
    const movieLabel = `${movie.title} ${movie.releaseYear}`.toLowerCase();
    return (
      movie.title.toLowerCase() === normalizedTitle ||
      movieLabel === normalizedTitle ||
      movie.title.toLowerCase().includes(normalizedTitle) ||
      normalizedTitle.includes(movie.title.toLowerCase())
    );
  });
}

export async function searchCatalogMovies({
  query,
  genre,
}: {
  query?: string;
  genre?: string;
}) {
  const normalizedQuery = query?.trim().toLowerCase();
  const allMovies = await getCatalogMovies();
  return allMovies.filter((movie) => {
    const matchesQuery =
      !normalizedQuery ||
      movie.title.toLowerCase().includes(normalizedQuery) ||
      movie.summary.toLowerCase().includes(normalizedQuery) ||
      movie.externalIds.imdb.toLowerCase().includes(normalizedQuery);
    const matchesGenre = !genre || genre === "all" || movie.genres.includes(genre);
    return matchesQuery && matchesGenre;
  });
}

export async function getCatalogGenres() {
  const allMovies = await getCatalogMovies();
  return Array.from(new Set(allMovies.flatMap((movie) => movie.genres))).sort();
}

export async function getCatalogStatsWithCommunity() {
  const pool = getDbPool();
  const [movieCount, sightingCount, spoilerCount] = await Promise.all([
    pool.query<{ count: string }>(
      `select count(*)::text as count from movies where is_deleted = false`,
    ),
    pool.query<{ count: string }>(
      `select count(*)::text as count from sightings where is_deleted = false`,
    ),
    pool.query<{ count: string }>(
      `select count(*)::text as count from sightings where is_deleted = false and spoiler = true`,
    ),
  ]);
  const sightingRows = await pool.query<{
    approximate_rat_count: number | null;
    scene_type: string;
  }>(
    `select approximate_rat_count, scene_type
     from sightings
     where is_deleted = false`,
  );
  const ratsTallied = sightingRows.rows.reduce((sum, row) => {
    if (typeof row.approximate_rat_count === "number" && row.approximate_rat_count >= 1) {
      return sum + Math.min(9999, Math.floor(row.approximate_rat_count));
    }
    return sum + (row.scene_type === "swarm" ? 6 : 1);
  }, 0);
  return {
    movies: Number(movieCount.rows[0]?.count ?? "0") || 0,
    sightings: Number(sightingCount.rows[0]?.count ?? "0") || 0,
    spoilerSightings: Number(spoilerCount.rows[0]?.count ?? "0") || 0,
    ratsTallied,
  };
}
