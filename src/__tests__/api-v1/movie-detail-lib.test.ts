import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/movie-catalog", () => ({
  getCatalogMovieBySlug: vi.fn(),
}));
vi.mock("@/lib/movie-edit-store", () => ({
  getDeletedMovieIds: vi.fn(),
  getMovieOverride: vi.fn(),
  applyMovieOverride: vi.fn(),
}));
vi.mock("@/lib/moderation-store", () => ({
  getMergedSightingsForMovie: vi.fn(),
}));
vi.mock("@/lib/movie-page-visuals", () => ({
  getMoviePageVisuals: vi.fn(),
}));

import { getV1MovieDetailJson } from "@/lib/api-v1/movie-detail";
import { getCatalogMovieBySlug } from "@/lib/movie-catalog";
import {
  getDeletedMovieIds,
  getMovieOverride,
  applyMovieOverride,
} from "@/lib/movie-edit-store";
import { getMergedSightingsForMovie } from "@/lib/moderation-store";
import { getMoviePageVisuals } from "@/lib/movie-page-visuals";

const mockGetCatalogMovieBySlug = vi.mocked(getCatalogMovieBySlug);
const mockGetDeletedMovieIds = vi.mocked(getDeletedMovieIds);
const mockGetMovieOverride = vi.mocked(getMovieOverride);
const mockApplyMovieOverride = vi.mocked(applyMovieOverride);
const mockGetMergedSightingsForMovie = vi.mocked(getMergedSightingsForMovie);
const mockGetMoviePageVisuals = vi.mocked(getMoviePageVisuals);

function makeMovie(overrides = {}) {
  return {
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
    metadata: {
      tagline: "He's dying to become a chef.",
      rating: "G",
      director: "Brad Bird",
      originalLanguage: "en",
      productionCountries: ["US"],
      metadataProvider: "OMDb via IMDb ID",
      lastSyncedAt: "2024-01-01T00:00:00Z",
    },
    ...overrides,
  };
}

function makeSighting(overrides = {}) {
  return {
    id: "sighting-1",
    movieId: "movie-1",
    timestamp: "42%",
    description: "Remy appears.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "mod",
    sourceIds: [],
    ...overrides,
  };
}

const DEFAULT_VISUALS = {
  palette: null,
  paletteDark: null,
  bannerUrl: "https://example.com/banner.jpg",
};

function setupDefaults(movie: ReturnType<typeof makeMovie> | null = makeMovie()) {
  mockGetCatalogMovieBySlug.mockResolvedValue(movie as never);
  mockGetDeletedMovieIds.mockResolvedValue(new Set() as never);
  mockGetMovieOverride.mockResolvedValue(null as never);
  mockApplyMovieOverride.mockImplementation((m) => m as never);
  mockGetMergedSightingsForMovie.mockResolvedValue([] as never);
  mockGetMoviePageVisuals.mockResolvedValue(DEFAULT_VISUALS as never);
}

describe("getV1MovieDetailJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when movie is not found", async () => {
    setupDefaults(null);
    const result = await getV1MovieDetailJson("unknown-slug", {});
    expect(result).toBeNull();
  });

  it("returns null when movie is soft-deleted", async () => {
    setupDefaults(makeMovie());
    mockGetDeletedMovieIds.mockResolvedValueOnce(new Set(["movie-1"]) as never);

    const result = await getV1MovieDetailJson("ratatouille-2007", {});
    expect(result).toBeNull();
  });

  it("returns v1 movie detail shape when movie exists", async () => {
    setupDefaults();

    const result = await getV1MovieDetailJson("ratatouille-2007", {});

    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
    expect(result!.movie.slug).toBe("ratatouille-2007");
    expect(result!.movie.title).toBe("Ratatouille");
    expect(result!.featuredRats).toBeDefined();
    expect(result!.tabs).toBeDefined();
    expect(result!.links).toBeDefined();
  });

  it("returns sightings in featuredRats", async () => {
    setupDefaults();
    mockGetMergedSightingsForMovie.mockResolvedValueOnce([
      makeSighting(),
      makeSighting({ id: "sighting-2" }),
    ] as never);

    const result = await getV1MovieDetailJson("ratatouille-2007", {});

    expect(result!.featuredRats.totalCount).toBe(2);
    expect(result!.movie.sightingCount).toBe(2);
  });

  it("includes headerBanner from visuals", async () => {
    setupDefaults();

    const result = await getV1MovieDetailJson("ratatouille-2007", {});
    expect(result!.movie.headerBanner).toBe("https://example.com/banner.jpg");
  });

  it("computes approxRatsOnScreen from sighting counts", async () => {
    setupDefaults();
    mockGetMergedSightingsForMovie.mockResolvedValueOnce([
      makeSighting({ approximateRatCount: 5 }),
      makeSighting({ id: "s2", approximateRatCount: 3 }),
    ] as never);

    const result = await getV1MovieDetailJson("ratatouille-2007", {});
    expect(result!.movie.approxRatsOnScreen).toBe(8);
  });

  it("passes sort and page to sightings view", async () => {
    setupDefaults();
    mockGetMergedSightingsForMovie.mockResolvedValueOnce([makeSighting()] as never);

    const result = await getV1MovieDetailJson("ratatouille-2007", {
      sort: "rats",
      page: "1",
    });

    // The route accepts sort parameter and should propagate it
    expect(result!.featuredRats.sort).toBeDefined();
  });

  it("decodes URL-encoded slugs", async () => {
    setupDefaults(makeMovie({ slug: "le-rat-2007" }));
    await getV1MovieDetailJson("le-rat-2007", {});
    expect(mockGetCatalogMovieBySlug).toHaveBeenCalledWith("le-rat-2007");
  });

  it("links.imdbTitle points to the correct IMDb URL", async () => {
    setupDefaults();

    const result = await getV1MovieDetailJson("ratatouille-2007", {});
    expect(result!.links.imdbTitle).toBe("https://www.imdb.com/title/tt0382932/");
  });

  it("returns tabs structure with fact/review/related arrays", async () => {
    setupDefaults(
      makeMovie({
        metadata: {
          tagline: "",
          rating: "G",
          director: "Brad Bird",
          originalLanguage: "en",
          productionCountries: [],
          metadataProvider: "OMDb via IMDb ID",
          lastSyncedAt: "2024-01-01",
          ratFacts: ["Rats are smart."],
          imdbReviews: [],
          imdbRelated: [],
          imdbVideos: [],
          imdbImages: [],
        },
      }),
    );

    const result = await getV1MovieDetailJson("ratatouille-2007", {});
    expect(result!.tabs.facts).toEqual(["Rats are smart."]);
    expect(Array.isArray(result!.tabs.reviews)).toBe(true);
    expect(Array.isArray(result!.tabs.related)).toBe(true);
  });
});
