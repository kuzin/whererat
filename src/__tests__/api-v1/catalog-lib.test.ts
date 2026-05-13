import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/movie-edit-store", () => ({
  getDeletedMovieIds: vi.fn(),
}));
vi.mock("@/lib/movie-catalog", () => ({
  getCatalogMovies: vi.fn(),
  searchCatalogMovies: vi.fn(),
  getCatalogGenres: vi.fn(),
}));
vi.mock("@/lib/moderation-store", () => ({
  getMergedSightingsForMovie: vi.fn(),
}));
vi.mock("@/lib/movie-page-visuals", () => ({
  getMoviePageVisuals: vi.fn(),
}));

import { getV1CatalogJson } from "@/lib/api-v1/catalog";
import { getDeletedMovieIds } from "@/lib/movie-edit-store";
import {
  getCatalogMovies,
  searchCatalogMovies,
  getCatalogGenres,
} from "@/lib/movie-catalog";
import { getMergedSightingsForMovie } from "@/lib/moderation-store";
import { getMoviePageVisuals } from "@/lib/movie-page-visuals";

const mockGetDeletedMovieIds = vi.mocked(getDeletedMovieIds);
const mockGetCatalogMovies = vi.mocked(getCatalogMovies);
const mockSearchCatalogMovies = vi.mocked(searchCatalogMovies);
const mockGetCatalogGenres = vi.mocked(getCatalogGenres);
const mockGetMergedSightingsForMovie = vi.mocked(getMergedSightingsForMovie);
const mockGetMoviePageVisuals = vi.mocked(getMoviePageVisuals);

function makeMovie(id: string, slug: string, overrides = {}) {
  return {
    id,
    slug,
    title: `Movie ${id}`,
    releaseYear: 2020,
    runtimeMinutes: 90,
    genres: ["Drama"],
    posterUrl: "",
    posterAlt: "",
    posterTone: "",
    summary: "",
    externalIds: { imdb: "tt0000001" },
    metadata: {
      rating: "PG",
      imdbRating: "7.0",
      imdbVotes: "10,000",
    },
    ...overrides,
  };
}

function makeSighting(movieId: string, opts: Record<string, unknown> = {}) {
  return {
    id: `sighting-${Math.random()}`,
    movieId,
    timestamp: "50%",
    description: "A rat.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "mod",
    sourceIds: [],
    ...opts,
  };
}

const DEFAULT_VISUALS = { palette: null, paletteDark: null, bannerUrl: null };

function setupDefaults() {
  mockGetDeletedMovieIds.mockResolvedValue(new Set() as never);
  mockGetCatalogGenres.mockResolvedValue(["Drama"] as never);
  mockGetMoviePageVisuals.mockResolvedValue(DEFAULT_VISUALS as never);
  mockGetMergedSightingsForMovie.mockResolvedValue([] as never);
}

describe("getV1CatalogJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a valid v1 catalog shape", async () => {
    const movies = [makeMovie("m1", "movie-m1")];
    mockGetCatalogMovies.mockResolvedValueOnce(movies as never);
    mockSearchCatalogMovies.mockResolvedValueOnce(movies as never);

    const result = await getV1CatalogJson({
      query: "",
      genre: "all",
      sort: "latest-added-title",
      page: 1,
      pageSize: 12,
    });

    expect(result.version).toBe(1);
    expect(Array.isArray(result.movies)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(typeof result.pageCount).toBe("number");
    expect(Array.isArray(result.genres)).toBe(true);
    expect(result.filters).toEqual({ q: "", genre: "all" });
    expect(result.sort).toBe("latest-added-title");
  });

  it("excludes deleted movies", async () => {
    const movies = [makeMovie("m1", "slug-m1"), makeMovie("m2", "slug-m2")];
    mockGetDeletedMovieIds.mockResolvedValueOnce(new Set(["m1"]) as never);
    mockGetCatalogMovies.mockResolvedValueOnce(movies as never);
    mockSearchCatalogMovies.mockResolvedValueOnce(movies as never);

    const result = await getV1CatalogJson({
      query: "",
      genre: "all",
      sort: "latest-added-title",
      page: 1,
      pageSize: 12,
    });

    expect(result.movies).toHaveLength(1);
    expect(result.movies[0].slug).toBe("slug-m2");
  });

  it("paginates results correctly", async () => {
    const movies = Array.from({ length: 15 }, (_, i) => makeMovie(`m${i}`, `slug-m${i}`));
    mockGetCatalogMovies.mockResolvedValueOnce(movies as never);
    mockSearchCatalogMovies.mockResolvedValueOnce(movies as never);

    const result = await getV1CatalogJson({
      query: "",
      genre: "all",
      sort: "latest-added-title",
      page: 2,
      pageSize: 10,
    });

    expect(result.movies).toHaveLength(5);
    expect(result.page).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(result.total).toBe(15);
  });

  it("sorts by most-rats-logged", async () => {
    const movies = [makeMovie("m1", "slug-m1"), makeMovie("m2", "slug-m2")];
    mockGetCatalogMovies.mockResolvedValueOnce(movies as never);
    mockSearchCatalogMovies.mockResolvedValueOnce(movies as never);
    // m2 has more rats
    mockGetMergedSightingsForMovie
      .mockResolvedValueOnce([makeSighting("m1", { approximateRatCount: 1 })] as never)
      .mockResolvedValueOnce([makeSighting("m2", { approximateRatCount: 10 })] as never);

    const result = await getV1CatalogJson({
      query: "",
      genre: "all",
      sort: "most-rats-logged",
      page: 1,
      pageSize: 12,
    });

    expect(result.movies[0].slug).toBe("slug-m2");
    expect(result.movies[1].slug).toBe("slug-m1");
  });

  it("sorts by total-sightings", async () => {
    const movies = [makeMovie("m1", "slug-m1"), makeMovie("m2", "slug-m2")];
    mockGetCatalogMovies.mockResolvedValueOnce(movies as never);
    mockSearchCatalogMovies.mockResolvedValueOnce(movies as never);
    mockGetMergedSightingsForMovie
      .mockResolvedValueOnce([makeSighting("m1")] as never)
      .mockResolvedValueOnce([
        makeSighting("m2"),
        makeSighting("m2"),
        makeSighting("m2"),
      ] as never);

    const result = await getV1CatalogJson({
      query: "",
      genre: "all",
      sort: "total-sightings",
      page: 1,
      pageSize: 12,
    });

    expect(result.movies[0].slug).toBe("slug-m2");
  });

  it("sorts by latest-sighting", async () => {
    const movies = [makeMovie("m1", "slug-m1"), makeMovie("m2", "slug-m2")];
    mockGetCatalogMovies.mockResolvedValueOnce(movies as never);
    mockSearchCatalogMovies.mockResolvedValueOnce(movies as never);
    // m2 has a more recent review date
    mockGetMergedSightingsForMovie
      .mockResolvedValueOnce([
        makeSighting("m1", { submissionReviewedAtISO: "2023-01-01T00:00:00Z" }),
      ] as never)
      .mockResolvedValueOnce([
        makeSighting("m2", { submissionReviewedAtISO: "2024-06-01T00:00:00Z" }),
      ] as never);

    const result = await getV1CatalogJson({
      query: "",
      genre: "all",
      sort: "latest-sighting",
      page: 1,
      pageSize: 12,
    });

    expect(result.movies[0].slug).toBe("slug-m2");
  });

  it("returns empty movies list when search returns nothing", async () => {
    mockGetCatalogMovies.mockResolvedValueOnce([] as never);
    mockSearchCatalogMovies.mockResolvedValueOnce([] as never);

    const result = await getV1CatalogJson({
      query: "nonexistent",
      genre: "all",
      sort: "latest-added-title",
      page: 1,
      pageSize: 12,
    });

    expect(result.movies).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });
});
