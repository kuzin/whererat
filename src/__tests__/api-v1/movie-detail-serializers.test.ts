import { describe, it, expect } from "vitest";
import {
  serializeSightingPublic,
  serializeMoviePublic,
} from "@/lib/api-v1/movie-detail";
import type { Movie, Sighting } from "@/lib/whererat";

function makeMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: "movie-1",
    slug: "ratatouille-2007",
    title: "Ratatouille",
    releaseYear: 2007,
    runtimeMinutes: 111,
    genres: ["Animation", "Comedy"],
    posterTone: "bg-amber-700",
    posterUrl: "https://example.com/poster.jpg",
    backdropUrl: "https://example.com/backdrop.jpg",
    posterAlt: "Ratatouille poster",
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

function makeSighting(overrides: Partial<Sighting> = {}): Sighting {
  return {
    id: "sighting-1",
    movieId: "movie-1",
    timestamp: "42%",
    title: "Rat in kitchen",
    description: "Remy appears in the kitchen.",
    prominence: "scene-stealer",
    sceneType: "live-action",
    spoiler: false,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: "moderator",
    sourceIds: [],
    ...overrides,
  };
}

describe("serializeSightingPublic", () => {
  it("includes all required contract fields", () => {
    const sighting = makeSighting();
    const result = serializeSightingPublic(sighting);

    expect(result).toMatchObject({
      id: "sighting-1",
      movieId: "movie-1",
      timestamp: "42%",
      title: "Rat in kitchen",
      description: "Remy appears in the kitchen.",
      prominence: "scene-stealer",
      sceneType: "live-action",
      spoiler: false,
      confidence: "verified",
      verificationState: "verified",
      verifiedBy: "moderator",
      sourceIds: [],
    });
  });

  it("includes optional fields when present", () => {
    const sighting = makeSighting({
      approximateRatCount: 3,
      images: [{ url: "https://example.com/img.jpg", alt: "Scene" }],
      imageUrl: "https://example.com/img.jpg",
      imageAlt: "Scene",
      submitterName: "Alice",
      submissionReviewedAtISO: "2024-01-01T00:00:00Z",
      curatorNote: "Verified via IMDb",
      imdbKind: "series",
      seasonNumber: 1,
      episodeNumber: 2,
      episodeTitle: "Pilot",
    });
    const result = serializeSightingPublic(sighting);

    expect(result.approximateRatCount).toBe(3);
    expect(result.submitterName).toBe("Alice");
    expect(result.submissionReviewedAtISO).toBe("2024-01-01T00:00:00Z");
    expect(result.imdbKind).toBe("series");
    expect(result.seasonNumber).toBe(1);
    expect(result.episodeNumber).toBe(2);
    expect(result.episodeTitle).toBe("Pilot");
  });

  it("does not leak private fields", () => {
    const sighting = makeSighting();
    const result = serializeSightingPublic(sighting) as Record<string, unknown>;
    // No DB-internal fields
    expect(result).not.toHaveProperty("is_deleted");
    expect(result).not.toHaveProperty("submitterEmail");
  });
});

describe("serializeMoviePublic", () => {
  it("includes all required contract fields", () => {
    const movie = makeMovie();
    const result = serializeMoviePublic(movie);

    expect(result).toMatchObject({
      id: "movie-1",
      slug: "ratatouille-2007",
      title: "Ratatouille",
      releaseYear: 2007,
      runtimeMinutes: 111,
      genres: ["Animation", "Comedy"],
      posterUrl: "https://example.com/poster.jpg",
      posterAlt: "Ratatouille poster",
      summary: "A rat dreams of becoming a chef.",
      externalIds: { imdb: "tt0382932" },
    });
  });

  it("includes metadata block", () => {
    const movie = makeMovie();
    const result = serializeMoviePublic(movie);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.rating).toBe("G");
    expect(result.metadata.director).toBe("Brad Bird");
  });
});
