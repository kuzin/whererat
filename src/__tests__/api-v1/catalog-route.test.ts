import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the lib module before importing the route handler
vi.mock("@/lib/api-v1/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-v1/catalog")>();
  return {
    ...actual,
    getV1CatalogJson: vi.fn(),
  };
});

import { GET } from "@/app/api/v1/catalog/route";
import { getV1CatalogJson } from "@/lib/api-v1/catalog";

const mockGetV1CatalogJson = vi.mocked(getV1CatalogJson);

const CATALOG_RESPONSE = {
  version: 1,
  genres: ["Animation", "Comedy"],
  sort: "latest-added-title",
  filters: { q: "", genre: "all" },
  page: 1,
  pageSize: 12,
  total: 1,
  pageCount: 1,
  movies: [
    {
      id: "movie-1",
      slug: "ratatouille-2007",
      title: "Ratatouille",
      releaseYear: 2007,
      runtimeMinutes: 111,
      genres: ["Animation"],
      posterUrl: "https://example.com/poster.jpg",
      posterAlt: "Poster",
      posterTone: "bg-amber-700",
      pagePalette: null,
      pagePaletteDark: null,
      summary: "A rat dreams of becoming a chef.",
      sightingCount: 3,
      rating: "G",
      imdbRating: "8.1",
      imdbVotes: "900,000",
    },
  ],
};

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe("GET /api/v1/catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with catalog payload and Cache-Control header", async () => {
    mockGetV1CatalogJson.mockResolvedValueOnce(CATALOG_RESPONSE as never);

    const req = makeRequest("http://localhost/api/v1/catalog");
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toMatch(/s-maxage/);

    const body = await response.json();
    expect(body.version).toBe(1);
    expect(Array.isArray(body.movies)).toBe(true);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBeTypeOf("number");
    expect(body.total).toBeTypeOf("number");
    expect(body.pageCount).toBeTypeOf("number");
    expect(Array.isArray(body.genres)).toBe(true);
    expect(body.filters).toBeDefined();
    expect(body.sort).toBeDefined();
  });

  it("passes query parameters to getV1CatalogJson", async () => {
    mockGetV1CatalogJson.mockResolvedValueOnce({ ...CATALOG_RESPONSE } as never);

    const req = makeRequest(
      "http://localhost/api/v1/catalog?q=rat&genre=Animation&sort=most-rats-logged&page=2&pageSize=5",
    );
    await GET(req);

    expect(mockGetV1CatalogJson).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "rat",
        genre: "Animation",
        sort: "most-rats-logged",
        page: 2,
        pageSize: 5,
      }),
    );
  });

  it("uses defaults when query params are omitted", async () => {
    mockGetV1CatalogJson.mockResolvedValueOnce({ ...CATALOG_RESPONSE } as never);

    const req = makeRequest("http://localhost/api/v1/catalog");
    await GET(req);

    expect(mockGetV1CatalogJson).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "",
        genre: "all",
        sort: "latest-added-title",
        page: 1,
      }),
    );
  });

  it("contract: each movie item has required fields", async () => {
    mockGetV1CatalogJson.mockResolvedValueOnce(CATALOG_RESPONSE as never);

    const req = makeRequest("http://localhost/api/v1/catalog");
    const response = await GET(req);
    const body = await response.json();

    for (const movie of body.movies) {
      expect(movie).toHaveProperty("id");
      expect(movie).toHaveProperty("slug");
      expect(movie).toHaveProperty("title");
      expect(movie).toHaveProperty("releaseYear");
      expect(movie).toHaveProperty("sightingCount");
    }
  });

  it("uses V1_CATALOG_PAGE_DEFAULT when pageSize param is omitted", async () => {
    mockGetV1CatalogJson.mockResolvedValueOnce({ ...CATALOG_RESPONSE } as never);

    const req = makeRequest("http://localhost/api/v1/catalog?q=rat");
    await GET(req);

    // When pageSize is absent, the route falls back to V1_CATALOG_PAGE_DEFAULT (12)
    expect(mockGetV1CatalogJson).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 12 }),
    );
  });
});
