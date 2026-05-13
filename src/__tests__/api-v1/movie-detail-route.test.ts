import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-v1/movie-detail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-v1/movie-detail")>();
  return {
    ...actual,
    getV1MovieDetailJson: vi.fn(),
  };
});

import { GET } from "@/app/api/v1/movies/[slug]/route";
import { getV1MovieDetailJson } from "@/lib/api-v1/movie-detail";

const mockGetV1MovieDetailJson = vi.mocked(getV1MovieDetailJson);

const MOVIE_RESPONSE = {
  version: 1,
  movie: {
    id: "movie-1",
    slug: "ratatouille-2007",
    title: "Ratatouille",
    releaseYear: 2007,
    runtimeMinutes: 111,
    genres: ["Animation"],
    posterTone: "bg-amber-700",
    posterUrl: "https://example.com/poster.jpg",
    backdropUrl: "",
    posterAlt: "Poster",
    summary: "A rat dreams of becoming a chef.",
    externalIds: { imdb: "tt0382932" },
    metadata: { rating: "G" },
    headerBanner: null,
    pagePalette: null,
    pagePaletteDark: null,
    sightingCount: 3,
    approxRatsOnScreen: 7,
  },
  featuredRats: {
    sort: "newest",
    sortLabels: {},
    page: 1,
    pageCount: 1,
    totalCount: 1,
    sightings: [],
  },
  tabs: { facts: [], reviews: [], related: [], videos: [], images: [] },
  links: { imdbTitle: "https://www.imdb.com/title/tt0382932/" },
};

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function makeContext(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/v1/movies/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with movie payload and Cache-Control header", async () => {
    mockGetV1MovieDetailJson.mockResolvedValueOnce(MOVIE_RESPONSE as never);

    const req = makeRequest("http://localhost/api/v1/movies/ratatouille-2007");
    const response = await GET(req, makeContext("ratatouille-2007"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toMatch(/s-maxage/);

    const body = await response.json();
    expect(body.version).toBe(1);
    expect(body.movie).toBeDefined();
    expect(body.featuredRats).toBeDefined();
    expect(body.tabs).toBeDefined();
    expect(body.links).toBeDefined();
  });

  it("returns 404 with error shape when movie not found", async () => {
    mockGetV1MovieDetailJson.mockResolvedValueOnce(null);

    const req = makeRequest("http://localhost/api/v1/movies/not-a-real-slug");
    const response = await GET(req, makeContext("not-a-real-slug"));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("not_found");
    expect(body.message).toBeTypeOf("string");
  });

  it("contract: movie has required top-level fields", async () => {
    mockGetV1MovieDetailJson.mockResolvedValueOnce(MOVIE_RESPONSE as never);

    const req = makeRequest("http://localhost/api/v1/movies/ratatouille-2007");
    const response = await GET(req, makeContext("ratatouille-2007"));
    const body = await response.json();

    expect(body.movie).toHaveProperty("id");
    expect(body.movie).toHaveProperty("slug");
    expect(body.movie).toHaveProperty("title");
    expect(body.movie).toHaveProperty("releaseYear");
    expect(body.movie).toHaveProperty("sightingCount");
    expect(body.movie).toHaveProperty("externalIds");
    expect(body.featuredRats).toHaveProperty("sightings");
    expect(Array.isArray(body.featuredRats.sightings)).toBe(true);
  });

  it("passes slug and sort/page query params to getV1MovieDetailJson", async () => {
    mockGetV1MovieDetailJson.mockResolvedValueOnce(MOVIE_RESPONSE as never);

    const req = makeRequest(
      "http://localhost/api/v1/movies/ratatouille-2007?sort=rats&page=2",
    );
    await GET(req, makeContext("ratatouille-2007"));

    expect(mockGetV1MovieDetailJson).toHaveBeenCalledWith(
      "ratatouille-2007",
      expect.objectContaining({ sort: "rats", page: "2" }),
    );
  });
});
