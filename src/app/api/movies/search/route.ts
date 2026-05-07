import { NextResponse } from "next/server";
import type { Movie } from "@/lib/whererat";
import { getDeletedMovieIds } from "@/lib/movie-edit-store";
import { getCatalogMovies } from "@/lib/movie-catalog";

type MovieSearchResult = {
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

type OmdbSearchItem = {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
  Type: string;
};

type OmdbDetails = {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
  Runtime?: string;
  Genre?: string;
  Rated?: string;
  Plot?: string;
  Response: "True" | "False";
};

type OmdbSearchPayload = {
  Search?: OmdbSearchItem[];
  Response: "True" | "False";
  Error?: string;
};

const FALLBACK_POSTER =
  "https://placehold.co/600x900/292524/fef3c7/png?text=IMDb+Title";

function posterOrFallback(poster: string | undefined) {
  return poster && poster !== "N/A" ? poster : FALLBACK_POSTER;
}

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function searchSeedCatalog(
  query: string,
  deletedMovieIds: Set<string>,
  catalogMovies: Movie[],
): MovieSearchResult[] {
  const normalizedQuery = normalizeSearchTerm(query);

  return catalogMovies
    .filter((movie) => !deletedMovieIds.has(movie.id))
    .filter((movie) => {
      const label = `${movie.title} ${movie.releaseYear} ${movie.externalIds.imdb}`;
      const normalizedLabel = normalizeSearchTerm(label);
      return normalizedLabel.includes(normalizedQuery);
    })
    .slice(0, 8)
    .map((movie) => ({
      title: movie.title,
      year: String(movie.releaseYear),
      imdbId: movie.externalIds.imdb,
      posterUrl: movie.posterUrl,
      runtime: `${movie.runtimeMinutes} min`,
      genre: movie.genres.join(", "),
      rating: movie.metadata.rating,
      plot: movie.summary,
      source: "Seed",
    }));
}

async function fetchOmdbDetails(imdbId: string, apiKey: string) {
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("plot", "short");

  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });

  if (!response.ok) {
    return undefined;
  }

  const details = (await response.json()) as OmdbDetails;

  if (details.Response !== "True") {
    return undefined;
  }

  return details;
}

async function fetchOmdbSearch(query: string, apiKey: string, page = 1) {
  const searchUrl = new URL("https://www.omdbapi.com/");
  searchUrl.searchParams.set("apikey", apiKey);
  searchUrl.searchParams.set("s", query);
  searchUrl.searchParams.set("type", "movie");
  if (page > 1) searchUrl.searchParams.set("page", String(page));

  const response = await fetch(searchUrl, { next: { revalidate: 60 * 60 } });
  if (!response.ok) return undefined;
  return (await response.json()) as OmdbSearchPayload;
}

function scoreTitleByQuery(title: string, query: string) {
  const queryTokens = normalizeSearchTerm(query).split(" ").filter(Boolean);
  const titleTokens = normalizeSearchTerm(title).split(" ").filter(Boolean);
  let score = 0;

  for (const queryToken of queryTokens) {
    if (titleTokens.some((token) => token === queryToken)) {
      score += 4;
      continue;
    }
    if (titleTokens.some((token) => token.startsWith(queryToken))) {
      score += 3;
      continue;
    }
    if (normalizeSearchTerm(title).includes(queryToken)) {
      score += 1;
    }
  }

  return score;
}

/** OMDb `s=` often misses prefix/typo queries (e.g. "Ratato") — try shorter strings in order. */
const MAX_OMDB_SEARCH_ATTEMPTS = 14;

function buildOmdbSearchCandidates(normalizedQuery: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.trim().replace(/\s+/g, " ");
    if (t.length < 2 || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  add(normalizedQuery);

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (tokens.length > 1) {
    for (let i = tokens.length - 1; i >= 1; i--) {
      add(tokens.slice(0, i).join(" "));
    }
  }

  for (let len = normalizedQuery.length - 1; len >= 2; len--) {
    add(normalizedQuery.slice(0, len));
  }

  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") ?? "";
  const query = rawQuery.trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const normalizedQuery = query.replace(/\s+/g, " ");
  const apiKey = process.env.OMDB_API_KEY;
  const deletedMovieIds = await getDeletedMovieIds();
  const catalogMovies = await getCatalogMovies();
  const deletedImdbIds = new Set(
    catalogMovies
      .filter((movie) => deletedMovieIds.has(movie.id))
      .map((movie) => movie.externalIds.imdb.toLowerCase()),
  );

  if (query.length < 2) {
    return NextResponse.json({ configured: Boolean(apiKey), results: [] });
  }

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      results: searchSeedCatalog(query, deletedMovieIds, catalogMovies),
    });
  }

  const candidates = buildOmdbSearchCandidates(normalizedQuery);
  let searchItems: OmdbSearchItem[] | undefined;
  let searchError: string | undefined;
  let gotNetworkResponse = false;

  for (let i = 0; i < candidates.length && i < MAX_OMDB_SEARCH_ATTEMPTS; i++) {
    const payload = await fetchOmdbSearch(candidates[i]!, apiKey, page);
    if (!payload) continue;
    gotNetworkResponse = true;
    searchError = payload.Error ?? searchError;
    if (payload.Response === "True" && payload.Search?.length) {
      searchItems = payload.Search
        .slice()
        .sort(
          (a, b) =>
            scoreTitleByQuery(b.Title, normalizedQuery) -
            scoreTitleByQuery(a.Title, normalizedQuery),
        );
      searchError = undefined;
      break;
    }
  }

  if (!gotNetworkResponse) {
    return NextResponse.json(
      { configured: true, error: "Movie search failed.", results: [] },
      { status: 502 },
    );
  }

  if (!searchItems) {
    const fallbackResults = searchSeedCatalog(
      normalizedQuery,
      deletedMovieIds,
      catalogMovies,
    );
    if (fallbackResults.length > 0) {
      return NextResponse.json({
        configured: true,
        error: searchError,
        results: fallbackResults,
      });
    }

    return NextResponse.json({
      configured: true,
      error: searchError ?? "No titles found.",
      results: [],
    });
  }

  const filteredItems = searchItems.filter(
    (item) => !deletedImdbIds.has(item.imdbID.toLowerCase()),
  );
  // OMDb returns up to 10 per page; if we got a full page there are likely more
  const hasMore = searchItems.length === 10;
  const visibleItems = filteredItems.slice(0, 10);
  const details = await Promise.all(
    visibleItems.map((item) => fetchOmdbDetails(item.imdbID, apiKey)),
  );

  const results: MovieSearchResult[] = visibleItems.map(
    (item, index) => {
      const itemDetails = details[index];

      return {
        title: itemDetails?.Title ?? item.Title,
        year: itemDetails?.Year ?? item.Year,
        imdbId: itemDetails?.imdbID ?? item.imdbID,
        posterUrl: posterOrFallback(itemDetails?.Poster ?? item.Poster),
        runtime: itemDetails?.Runtime,
        genre: itemDetails?.Genre,
        rating: itemDetails?.Rated,
        plot: itemDetails?.Plot,
        source: "OMDb",
      };
    },
  );

  return NextResponse.json({ configured: true, results, hasMore, page });
}
