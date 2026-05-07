import type { CatalogResponse, MovieDetailResponse } from "./types";

function baseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://whererat.com";
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

export function getApiOrigin(): string {
  return baseUrl();
}

/** Public marketing / policy URLs — not derived from API base (dev APIs may point at localhost). */
const PUBLIC_SITE_ORIGIN = "https://whererat.com";

export function getPrivacyPolicyWebUrl(): string {
  return `${PUBLIC_SITE_ORIGIN}/privacy`;
}

function absolutizeMediaUrl(url: string | undefined): string | undefined {
  const raw = url?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${baseUrl()}${raw}`;
  return `${baseUrl()}/${raw}`;
}

export function fetchCatalogPage(params: {
  q: string;
  genre: string;
  sort: string;
  page: number;
  pageSize?: number;
}): Promise<CatalogResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  sp.set("genre", params.genre || "all");
  sp.set("sort", params.sort);
  sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  return getJson<CatalogResponse>(`/api/v1/catalog?${sp.toString()}`);
}

export function fetchMovieDetail(params: {
  slug: string;
  sort?: string;
  page?: number;
}): Promise<MovieDetailResponse> {
  const sp = new URLSearchParams();
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const q = sp.toString();
  const path = `/api/v1/movies/${encodeURIComponent(params.slug)}${q ? `?${q}` : ""}`;
  return getJson<MovieDetailResponse>(path).then((payload) => {
    const normalizedSightings = payload.featuredRats.sightings.map((sighting) => ({
      ...sighting,
      imageUrl: absolutizeMediaUrl(sighting.imageUrl),
      images: sighting.images?.map((img) => ({
        ...img,
        url: absolutizeMediaUrl(img.url) ?? img.url,
      })),
    }));
    return {
      ...payload,
      featuredRats: {
        ...payload.featuredRats,
        sightings: normalizedSightings,
      },
    };
  });
}

/** Same shape as `GET /api/movies/search` (OMDb-backed IMDb movie search used on web `/submit`). */
export type ImdbMovieSearchResult = {
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

export type ImdbMovieSearchResponse = {
  configured: boolean;
  error?: string;
  results: ImdbMovieSearchResult[];
  hasMore?: boolean;
  page?: number;
};

/**
 * Search IMDb titles via server-side OMDb (falls back to a small local seed list when OMDB_API_KEY is unset).
 */
export async function fetchImdbMovieSearch(params: {
  q: string;
  page?: number;
}): Promise<ImdbMovieSearchResponse> {
  const urlBase = `${baseUrl()}/api/movies/search`;
  const sp = new URLSearchParams();
  sp.set("q", params.q.trim());
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const url = `${urlBase}?${sp.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  const rec = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const results = Array.isArray(rec.results)
    ? (rec.results as ImdbMovieSearchResult[])
    : [];
  const out: ImdbMovieSearchResponse = {
    configured: typeof rec.configured === "boolean" ? rec.configured : true,
    error: typeof rec.error === "string" ? rec.error : undefined,
    results,
    hasMore: typeof rec.hasMore === "boolean" ? rec.hasMore : undefined,
    page: typeof rec.page === "number" ? rec.page : undefined,
  };

  if (!res.ok && !out.error) {
    return { ...out, error: "Movie search failed." };
  }

  return out;
}

export type SubmitSightingResponse = {
  ok: true;
  submissionId: string;
  catalogSlug: string | null;
};

/**
 * Submit a sighting into the moderator queue (`POST /api/v1/submissions`).
 * Use the same `FormData` field names as the web `/submit` form.
 */
export async function postSightingSubmission(formData: FormData): Promise<SubmitSightingResponse> {
  const url = `${baseUrl()}/api/v1/submissions`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  const rec = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  if (!res.ok) {
    const msg =
      typeof rec.message === "string"
        ? rec.message
        : typeof rec.error === "string"
          ? rec.error
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (rec.ok !== true || typeof rec.submissionId !== "string") {
    throw new Error("Unexpected submission response");
  }
  return {
    ok: true,
    submissionId: rec.submissionId,
    catalogSlug: typeof rec.catalogSlug === "string" ? rec.catalogSlug : null,
  };
}
