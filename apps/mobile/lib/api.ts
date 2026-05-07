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
