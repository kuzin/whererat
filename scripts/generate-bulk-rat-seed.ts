/**
 * Fetches TMDB titles tagged with keyword "rat" and writes
 * src/lib/generated/bulk-rat-seed.json for merge in whererat.ts.
 *
 * Requires TMDB_READ_ACCESS_TOKEN (or TMDB_API_READ_ACCESS_TOKEN / TMDB_BEARER_TOKEN).
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import "./load-env";
import type { Movie, Sighting } from "@/lib/whererat";

const TMDB_API = "https://api.themoviedb.org/3";

const RAT_KEYWORD_ID = 189359;
/** Up to MAX_KEYWORD_PAGES × ~20 titles (detail-fetched; IMDB ID required). */
const MAX_KEYWORD_PAGES = 45;
const DETAIL_PAUSE_MS = 35;

function tmdbBearer(): string | undefined {
  return (
    process.env.TMDB_READ_ACCESS_TOKEN?.trim() ||
    process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() ||
    process.env.TMDB_BEARER_TOKEN?.trim()
  );
}

function slugifyTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tmdbFetch<T>(pathAndQuery: string, token: string): Promise<T> {
  const res = await fetch(`${TMDB_API}${pathAndQuery}`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`TMDB ${pathAndQuery}: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

type KeywordMoviesPage = {
  page: number;
  total_pages: number;
  results: { id: number }[];
};

type MovieDetail = {
  id: number;
  title: string;
  overview: string;
  runtime: number | null;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  imdb_id: string | null;
};

function posterToneForId(id: number): string {
  const tones = [
    "bg-amber-500",
    "bg-stone-600",
    "bg-amber-800",
    "bg-orange-700",
    "bg-yellow-600",
    "bg-lime-700",
    "bg-emerald-700",
    "bg-teal-700",
  ];
  return tones[Math.abs(id) % tones.length] ?? "bg-stone-600";
}

function percentForMovieId(id: number): string {
  const pct = (Math.abs(id * 37) % 86) + 7;
  return `${pct}%`;
}

function sceneTypeForGenres(genres: string[]): Sighting["sceneType"] {
  const g = genres.join(" ").toLowerCase();
  if (g.includes("animation")) return "animated";
  return "live-action";
}

function buildMovie(detail: MovieDetail): Movie {
  const year = Number.parseInt(detail.release_date?.slice(0, 4) ?? "", 10);
  const releaseYear = Number.isFinite(year) && year > 1800 ? year : 1900;
  const runtimeMinutes =
    detail.runtime && detail.runtime > 0 ? detail.runtime : 92;
  const genres =
    detail.genres?.map((g) => g.name).filter(Boolean) ?? ["Uncategorized"];
  const slugBase = `${slugifyTitle(detail.title)}-${releaseYear}`;
  const slug = slugBase || `tmdb-${detail.id}`;

  const posterUrl = detail.poster_path
    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
    : "https://placehold.co/600x900/292524/fef3c7/png?text=Rat+movie";
  const backdropUrl = detail.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
    : posterUrl;

  return {
    id: slug,
    slug,
    title: detail.title,
    releaseYear,
    runtimeMinutes,
    genres,
    posterTone: posterToneForId(detail.id),
    posterUrl,
    backdropUrl,
    posterAlt: `Poster image for ${detail.title}.`,
    externalIds: {
      tmdb: String(detail.id),
      imdb: detail.imdb_id!,
    },
    metadata: {
      tagline: "",
      rating: "",
      director: "",
      originalLanguage: "",
      productionCountries: [],
      metadataProvider: "TMDB keyword seed",
      lastSyncedAt: new Date().toISOString().slice(0, 10),
    },
    summary:
      detail.overview?.trim() ||
      "Imported from TMDB because the title is tagged with the “rat” keyword; overview unavailable.",
  };
}

function buildSighting(detail: MovieDetail, movie: Movie): Sighting {
  const posterStill = detail.poster_path
    ? `https://image.tmdb.org/t/p/w780${detail.poster_path}`
    : movie.posterUrl;

  const shortLine =
    detail.overview?.split(/(?<=[.!?])\s/)[0]?.trim() ||
    `TMDB lists this film under the keyword “rat”.`;

  return {
    id: `bulk-rat-${detail.id}`,
    movieId: movie.id,
    timestamp: percentForMovieId(detail.id),
    title: "Rat keyword listing (needs scene pass)",
    description: `${shortLine} Scene timing, spoiler status, prominence, and count are placeholders from the TMDB bulk import and should be reviewed by a curator.`,
    prominence: "background",
    sceneType: sceneTypeForGenres(movie.genres),
    spoiler: false,
    confidence: "needs-source",
    verificationState: "pending",
    verifiedBy: "TMDB bulk import",
    sourceIds: ["tmdb-keyword-rat"],
    approximateRatCount: 1,
    images: [
      {
        url: posterStill,
        alt: `${detail.title}: TMDB poster still (bulk keyword seed).`,
      },
    ],
  };
}

async function main() {
  const token = tmdbBearer();
  if (!token) {
    console.error(
      "Missing TMDB_READ_ACCESS_TOKEN (or TMDB_API_READ_ACCESS_TOKEN / TMDB_BEARER_TOKEN).",
    );
    process.exitCode = 1;
    return;
  }

  const listIds: number[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_KEYWORD_PAGES) {
    const pageData = await tmdbFetch<KeywordMoviesPage>(
      `/keyword/${RAT_KEYWORD_ID}/movies?page=${page}&language=en-US`,
      token,
    );
    totalPages = pageData.total_pages;
    for (const row of pageData.results) {
      if (!listIds.includes(row.id)) listIds.push(row.id);
    }
    page += 1;
    await sleep(20);
  }

  const moviesOut: Movie[] = [];
  const sightingsOut: Sighting[] = [];
  const seenSlug = new Set<string>();

  for (const id of listIds) {
    let detail: MovieDetail;
    try {
      detail = await tmdbFetch<MovieDetail>(
        `/movie/${id}?language=en-US`,
        token,
      );
    } catch (e) {
      console.warn(`Skip movie ${id}:`, e);
      continue;
    }

    if (!detail.imdb_id?.trim()) {
      await sleep(DETAIL_PAUSE_MS);
      continue;
    }

    const movie = buildMovie(detail);
    if (seenSlug.has(movie.slug)) {
      movie.id = `${movie.slug}-tmdb-${detail.id}`;
      movie.slug = movie.id;
    }
    seenSlug.add(movie.slug);

    moviesOut.push(movie);
    sightingsOut.push(buildSighting(detail, movie));
    await sleep(DETAIL_PAUSE_MS);
  }

  const outPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "generated",
    "bulk-rat-seed.json",
  );
  await writeFile(
    outPath,
    `${JSON.stringify({ movies: moviesOut, sightings: sightingsOut }, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Wrote ${moviesOut.length} movies and ${sightingsOut.length} sightings → ${outPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
