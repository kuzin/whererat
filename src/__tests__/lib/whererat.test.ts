import { describe, it, expect } from "vitest";
import {
  normalizeImdbId,
  clampApproximateRatCount,
  estimateRatsForAppearance,
  formatRuntimeMinutes,
  normalizeSightingTimestampInput,
  getSightingTimestampPercent,
  formatPercentAsTimestamp,
  parseMovieSightingsSortParam,
  parseMovieSightingsPageParam,
  prepareMovieSightingsView,
  getMovieSightingsSortOptions,
  formatApproximateRatLine,
  getSightingCardHeadline,
  formatSightingEpisodeContext,
  getRatPresenceScale,
  movieSightingsQueryString,
  buildMovieSightingsPath,
  sightingAppearanceStartSeconds,
  getCatalogStats,
  searchMovies,
  formatContentWarningLabel,
  getImdbTitleUrl,
  formatRuntimeMinutes as fmt,
} from "@/lib/whererat";
import type { Sighting } from "@/lib/whererat";

function makeSighting(overrides: Partial<Sighting> = {}): Sighting {
  return {
    id: "s1",
    movieId: "m1",
    timestamp: "42%",
    description: "A rat appears on the counter.",
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

// ── normalizeImdbId ───────────────────────────────────────────────────────────

describe("normalizeImdbId", () => {
  it("extracts tt-ID from a full URL", () => {
    expect(normalizeImdbId("https://www.imdb.com/title/tt0382932/")).toBe("tt0382932");
  });

  it("extracts a bare tt-ID", () => {
    expect(normalizeImdbId("tt0382932")).toBe("tt0382932");
  });

  it("lowercases the ID", () => {
    expect(normalizeImdbId("TT0382932")).toBe("tt0382932");
  });

  it("returns empty string for invalid input", () => {
    expect(normalizeImdbId("")).toBe("");
    expect(normalizeImdbId("not-an-id")).toBe("");
  });
});

// ── clampApproximateRatCount ──────────────────────────────────────────────────

describe("clampApproximateRatCount", () => {
  it("clamps to 1 for values below 1", () => {
    expect(clampApproximateRatCount("0")).toBe(1);
    expect(clampApproximateRatCount("-5")).toBe(1);
    expect(clampApproximateRatCount("abc")).toBe(1);
    expect(clampApproximateRatCount(null)).toBe(1);
  });

  it("clamps to 9999 for large values", () => {
    expect(clampApproximateRatCount("10000")).toBe(9999);
    expect(clampApproximateRatCount("99999")).toBe(9999);
  });

  it("returns the value for valid counts", () => {
    expect(clampApproximateRatCount("5")).toBe(5);
    expect(clampApproximateRatCount("9999")).toBe(9999);
  });
});

// ── estimateRatsForAppearance ────────────────────────────────────────────────

describe("estimateRatsForAppearance", () => {
  it("returns approximateRatCount when set", () => {
    expect(estimateRatsForAppearance(makeSighting({ approximateRatCount: 7 }))).toBe(7);
  });

  it("clamps to 9999", () => {
    expect(estimateRatsForAppearance(makeSighting({ approximateRatCount: 10000 }))).toBe(9999);
  });

  it("returns 6 for swarm scenes when no count given", () => {
    expect(estimateRatsForAppearance(makeSighting({ sceneType: "swarm" }))).toBe(6);
  });

  it("returns 1 for other scenes when no count given", () => {
    expect(estimateRatsForAppearance(makeSighting())).toBe(1);
  });
});

// ── formatRuntimeMinutes ─────────────────────────────────────────────────────

describe("formatRuntimeMinutes", () => {
  it("handles 0 and invalid input", () => {
    expect(formatRuntimeMinutes(0)).toBe("");
    expect(formatRuntimeMinutes(-1)).toBe("");
    expect(formatRuntimeMinutes(NaN)).toBe("");
  });

  it("formats minutes only", () => {
    expect(formatRuntimeMinutes(45)).toBe("45 min");
  });

  it("formats hours only", () => {
    expect(formatRuntimeMinutes(120)).toBe("2 hr");
  });

  it("formats hours and minutes", () => {
    expect(formatRuntimeMinutes(111)).toBe("1 hr 51 min");
  });
});

// ── normalizeSightingTimestampInput ──────────────────────────────────────────

describe("normalizeSightingTimestampInput", () => {
  it("normalizes a plain number to percent format", () => {
    expect(normalizeSightingTimestampInput("42")).toBe("42%");
    expect(normalizeSightingTimestampInput("0")).toBe("0%");
    expect(normalizeSightingTimestampInput("100")).toBe("100%");
  });

  it("preserves already-formatted percent strings", () => {
    expect(normalizeSightingTimestampInput("42%")).toBe("42%");
  });

  it("returns timecodes unchanged", () => {
    expect(normalizeSightingTimestampInput("1:23:45")).toBe("1:23:45");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeSightingTimestampInput("")).toBe("");
    expect(normalizeSightingTimestampInput("  ")).toBe("");
  });
});

// ── getSightingTimestampPercent ──────────────────────────────────────────────

describe("getSightingTimestampPercent", () => {
  it("parses plain percent value", () => {
    expect(getSightingTimestampPercent("42%")).toBe(42);
    expect(getSightingTimestampPercent("0")).toBe(0);
    expect(getSightingTimestampPercent("100")).toBe(100);
  });

  it("clamps to 0–100", () => {
    expect(getSightingTimestampPercent("150")).toBe(100);
    expect(getSightingTimestampPercent("-10")).toBe(null);
  });

  it("returns null for non-percent input", () => {
    expect(getSightingTimestampPercent("1:23:45")).toBe(null);
    expect(getSightingTimestampPercent("abc")).toBe(null);
  });
});

// ── formatPercentAsTimestamp ─────────────────────────────────────────────────

describe("formatPercentAsTimestamp", () => {
  it("converts percent + runtime to a readable timestamp", () => {
    expect(formatPercentAsTimestamp("50%", 120)).toBe("1h 00m 00s");
    expect(formatPercentAsTimestamp("0", 60)).toBe("0m 00s");
  });

  it("returns null when runtime is not provided", () => {
    expect(formatPercentAsTimestamp("42%", undefined)).toBeNull();
    expect(formatPercentAsTimestamp("42%", 0)).toBeNull();
  });

  it("returns null for non-percent input", () => {
    expect(formatPercentAsTimestamp("abc", 120)).toBeNull();
  });
});

// ── parseMovieSightingsSortParam ──────────────────────────────────────────────

describe("parseMovieSightingsSortParam", () => {
  it("accepts valid values", () => {
    expect(parseMovieSightingsSortParam("newest")).toBe("newest");
    expect(parseMovieSightingsSortParam("rats")).toBe("rats");
    expect(parseMovieSightingsSortParam("appearance-early")).toBe("appearance-early");
    expect(parseMovieSightingsSortParam("appearance-late")).toBe("appearance-late");
    expect(parseMovieSightingsSortParam("episode")).toBe("episode");
  });

  it("falls back to newest for unknown values", () => {
    expect(parseMovieSightingsSortParam(undefined)).toBe("newest");
    expect(parseMovieSightingsSortParam("")).toBe("newest");
    expect(parseMovieSightingsSortParam("bogus")).toBe("newest");
  });
});

// ── parseMovieSightingsPageParam ──────────────────────────────────────────────

describe("parseMovieSightingsPageParam", () => {
  it("parses valid pages", () => {
    expect(parseMovieSightingsPageParam("1")).toBe(1);
    expect(parseMovieSightingsPageParam("5")).toBe(5);
  });

  it("clamps invalid values to 1", () => {
    expect(parseMovieSightingsPageParam(undefined)).toBe(1);
    expect(parseMovieSightingsPageParam("0")).toBe(1);
    expect(parseMovieSightingsPageParam("-3")).toBe(1);
    expect(parseMovieSightingsPageParam("abc")).toBe(1);
  });
});

// ── getMovieSightingsSortOptions ──────────────────────────────────────────────

describe("getMovieSightingsSortOptions", () => {
  it("includes episode option for series", () => {
    expect(getMovieSightingsSortOptions(true)).toContain("episode");
  });

  it("excludes episode option for movies", () => {
    expect(getMovieSightingsSortOptions(false)).not.toContain("episode");
  });
});

// ── prepareMovieSightingsView ─────────────────────────────────────────────────

describe("prepareMovieSightingsView", () => {
  function makeSightings(n: number): Sighting[] {
    return Array.from({ length: n }, (_, i) => makeSighting({ id: `s${i}` }));
  }

  it("returns all sightings on page 1 when count ≤ page size", () => {
    const items = makeSightings(5);
    const { pageSlice, totalCount, pageCount, safePage } = prepareMovieSightingsView({
      items,
      sort: "newest",
      page: 1,
    });
    expect(totalCount).toBe(5);
    expect(pageSlice).toHaveLength(5);
    expect(pageCount).toBe(1);
    expect(safePage).toBe(1);
  });

  it("paginates correctly", () => {
    const items = makeSightings(25);
    const { pageSlice, pageCount } = prepareMovieSightingsView({
      items,
      sort: "newest",
      page: 2,
      pageSize: 10,
    });
    expect(pageSlice).toHaveLength(10);
    expect(pageCount).toBe(3);
  });

  it("clamps out-of-range page to last page", () => {
    const items = makeSightings(5);
    const { safePage } = prepareMovieSightingsView({
      items,
      sort: "newest",
      page: 99,
    });
    expect(safePage).toBe(1);
  });

  it("handles empty items", () => {
    const { totalCount, pageCount, pageSlice } = prepareMovieSightingsView({
      items: [],
      sort: "newest",
      page: 1,
    });
    expect(totalCount).toBe(0);
    expect(pageCount).toBe(1);
    expect(pageSlice).toHaveLength(0);
  });
});

// ── formatApproximateRatLine ──────────────────────────────────────────────────

describe("formatApproximateRatLine", () => {
  it("formats a single rat", () => {
    expect(formatApproximateRatLine(1)).toBe("Approx. 1 rat");
  });

  it("formats plural rats", () => {
    expect(formatApproximateRatLine(5)).toBe("Approx. 5 rats");
  });

  it("uses rodent type when specified", () => {
    expect(formatApproximateRatLine(2, ["mouse"])).toBe("Approx. 2 mice");
    expect(formatApproximateRatLine(1, ["mouse"])).toBe("Approx. 1 Mouse");
  });

  it("uses generic rodent label for multiple types", () => {
    expect(formatApproximateRatLine(3, ["rat", "mouse"])).toBe("Approx. 3 rodents");
  });
});

// ── getSightingCardHeadline ───────────────────────────────────────────────────

describe("getSightingCardHeadline", () => {
  it("uses explicit title when set", () => {
    const s = makeSighting({ title: "The big reveal" });
    expect(getSightingCardHeadline(s)).toBe("The big reveal");
  });

  it("extracts first sentence from description when no title", () => {
    const s = makeSighting({ title: undefined, description: "Rat sits on cheese. More text." });
    expect(getSightingCardHeadline(s)).toBe("Rat sits on cheese.");
  });

  it("falls back to 'Sighting' for blank data", () => {
    const s = makeSighting({ title: undefined, description: "" });
    expect(getSightingCardHeadline(s)).toBe("Sighting");
  });
});

// ── formatSightingEpisodeContext ──────────────────────────────────────────────

describe("formatSightingEpisodeContext", () => {
  it("returns undefined for non-series", () => {
    expect(formatSightingEpisodeContext({ imdbKind: "movie" })).toBeUndefined();
    expect(formatSightingEpisodeContext({})).toBeUndefined();
  });

  it("returns S1E2 format for series without episode title", () => {
    expect(
      formatSightingEpisodeContext({ imdbKind: "series", seasonNumber: 1, episodeNumber: 2 }),
    ).toBe("S1E2");
  });

  it("includes episode title when present", () => {
    expect(
      formatSightingEpisodeContext({
        imdbKind: "series",
        seasonNumber: 2,
        episodeNumber: 5,
        episodeTitle: "Pilot",
      }),
    ).toBe("S2E5 · Pilot");
  });

  it("returns undefined when season/episode numbers are missing", () => {
    expect(formatSightingEpisodeContext({ imdbKind: "series" })).toBeUndefined();
  });
});

// ── prepareMovieSightingsView — additional sort modes ─────────────────────────

describe("prepareMovieSightingsView — sort modes", () => {
  function makeSightingWithRats(id: string, rats: number, timestamp = "50%"): Sighting {
    return makeSighting({ id, approximateRatCount: rats, timestamp });
  }

  it("sorts by rats descending", () => {
    const items = [
      makeSightingWithRats("s1", 1),
      makeSightingWithRats("s2", 10),
      makeSightingWithRats("s3", 5),
    ];
    const { pageSlice } = prepareMovieSightingsView({ items, sort: "rats", page: 1 });
    expect(pageSlice[0].id).toBe("s2");
    expect(pageSlice[2].id).toBe("s1");
  });

  it("sorts by appearance-early", () => {
    const items = [
      makeSighting({ id: "s1", timestamp: "80%" }),
      makeSighting({ id: "s2", timestamp: "10%" }),
      makeSighting({ id: "s3", timestamp: "50%" }),
    ];
    const { pageSlice } = prepareMovieSightingsView({ items, sort: "appearance-early", page: 1, runtimeMinutes: 100 });
    expect(pageSlice[0].id).toBe("s2");
    expect(pageSlice[2].id).toBe("s1");
  });

  it("sorts by appearance-late", () => {
    const items = [
      makeSighting({ id: "s1", timestamp: "80%" }),
      makeSighting({ id: "s2", timestamp: "10%" }),
      makeSighting({ id: "s3", timestamp: "50%" }),
    ];
    const { pageSlice } = prepareMovieSightingsView({ items, sort: "appearance-late", page: 1, runtimeMinutes: 100 });
    expect(pageSlice[0].id).toBe("s1");
    expect(pageSlice[2].id).toBe("s2");
  });

  it("sorts by episode order", () => {
    const items = [
      makeSighting({ id: "s1", imdbKind: "series", seasonNumber: 2, episodeNumber: 1 }),
      makeSighting({ id: "s2", imdbKind: "series", seasonNumber: 1, episodeNumber: 5 }),
      makeSighting({ id: "s3", imdbKind: "series", seasonNumber: 1, episodeNumber: 1 }),
    ];
    const { pageSlice } = prepareMovieSightingsView({ items, sort: "episode", page: 1 });
    expect(pageSlice[0].id).toBe("s3");
    expect(pageSlice[1].id).toBe("s2");
    expect(pageSlice[2].id).toBe("s1");
  });
});

// ── sightingAppearanceStartSeconds ────────────────────────────────────────────

describe("sightingAppearanceStartSeconds", () => {
  it("converts percent to seconds * 60", () => {
    expect(sightingAppearanceStartSeconds(makeSighting({ timestamp: "50%" }))).toBe(3000);
  });

  it("parses HH:MM:SS timecode", () => {
    expect(sightingAppearanceStartSeconds(makeSighting({ timestamp: "1:02:03" }))).toBe(3723);
  });

  it("parses MM:SS timecode", () => {
    expect(sightingAppearanceStartSeconds(makeSighting({ timestamp: "2:30" }))).toBe(150);
  });

  it("returns 0 for unparseable input", () => {
    expect(sightingAppearanceStartSeconds(makeSighting({ timestamp: "abc" }))).toBe(0);
  });
});

// ── movieSightingsQueryString ─────────────────────────────────────────────────

describe("movieSightingsQueryString", () => {
  it("returns empty string for defaults", () => {
    expect(movieSightingsQueryString({ sort: "newest", page: 1 })).toBe("");
  });

  it("includes sort when non-default", () => {
    const qs = movieSightingsQueryString({ sort: "rats", page: 1 });
    expect(qs).toContain("sort=rats");
  });

  it("includes page when > 1", () => {
    const qs = movieSightingsQueryString({ sort: "newest", page: 3 });
    expect(qs).toContain("page=3");
  });
});

// ── buildMovieSightingsPath ───────────────────────────────────────────────────

describe("buildMovieSightingsPath", () => {
  it("returns plain path for default params", () => {
    expect(buildMovieSightingsPath("/movies/ratatouille-2007", { sort: "newest", page: 1 })).toBe(
      "/movies/ratatouille-2007",
    );
  });

  it("appends query string when params are non-default", () => {
    const path = buildMovieSightingsPath("/movies/ratatouille-2007", { sort: "rats", page: 2 });
    expect(path).toContain("/movies/ratatouille-2007?");
    expect(path).toContain("sort=rats");
    expect(path).toContain("page=2");
  });

  it("works with shows paths", () => {
    expect(buildMovieSightingsPath("/shows/the-bear-s01", { sort: "newest", page: 1 })).toBe(
      "/shows/the-bear-s01",
    );
  });
});

// ── getRatPresenceScale ────────────────────────────────────────────────────────

describe("getRatPresenceScale", () => {
  it("lone scout for 1 rat", () => {
    expect(getRatPresenceScale(1).caption).toBe("Lone scout");
    expect(getRatPresenceScale(1).slotsFilled).toBe(1);
  });

  it("small pack for 2–3 rats", () => {
    expect(getRatPresenceScale(2).caption).toBe("Small pack");
    expect(getRatPresenceScale(3).caption).toBe("Small pack");
  });

  it("growing colony for 4–7", () => {
    expect(getRatPresenceScale(5).caption).toBe("Growing colony");
  });

  it("swarm forming for 8–15", () => {
    expect(getRatPresenceScale(10).caption).toBe("Swarm forming");
  });

  it("full swarm for 16–40", () => {
    expect(getRatPresenceScale(25).caption).toBe("Full swarm");
  });

  it("rat apocalypse for 41+", () => {
    expect(getRatPresenceScale(41).caption).toBe("Rat apocalypse");
    expect(getRatPresenceScale(999).caption).toBe("Rat apocalypse");
  });

  it("handles invalid input", () => {
    expect(getRatPresenceScale(0).caption).toBe("Lone scout");
    expect(getRatPresenceScale(-5).caption).toBe("Lone scout");
  });
});

// ── getCatalogStats ────────────────────────────────────────────────────────────

describe("getCatalogStats", () => {
  it("returns numeric counts", () => {
    const stats = getCatalogStats();
    expect(typeof stats.movies).toBe("number");
    expect(typeof stats.sightings).toBe("number");
    expect(typeof stats.ratsTallied).toBe("number");
    expect(typeof stats.pendingSubmissions).toBe("number");
    expect(typeof stats.spoilerSightings).toBe("number");
  });
});

// ── searchMovies ──────────────────────────────────────────────────────────────

describe("searchMovies", () => {
  it("returns all movies with no filter", () => {
    const results = searchMovies({});
    expect(Array.isArray(results)).toBe(true);
  });

  it("returns empty for non-matching query", () => {
    const results = searchMovies({ query: "zzzzzzz_definitely_no_match" });
    expect(results).toHaveLength(0);
  });
});

// ── formatContentWarningLabel ─────────────────────────────────────────────────

describe("formatContentWarningLabel", () => {
  it("rewrites 'Rat' in label to match rodent type", () => {
    expect(formatContentWarningLabel("rat-dies", ["mouse"])).toBe("Mouse dies");
    expect(formatContentWarningLabel("rat-dies", ["rat", "mouse"])).toBe("Rodent dies");
  });

  it("returns label unchanged for generic warnings", () => {
    expect(formatContentWarningLabel("jump-scare")).toBe("Jump scare");
    expect(formatContentWarningLabel("graphic")).toBe("Graphic / disturbing");
  });

  it("returns the id for unknown warning ids", () => {
    expect(formatContentWarningLabel("unknown-id")).toBe("unknown-id");
  });
});

// ── getImdbTitleUrl ────────────────────────────────────────────────────────────

describe("getImdbTitleUrl", () => {
  it("returns the correct IMDb URL", () => {
    expect(getImdbTitleUrl("tt0382932")).toBe("https://www.imdb.com/title/tt0382932/");
  });
});

// ── catalog-seed based functions ──────────────────────────────────────────────
// These use the global movies/sightings arrays populated from catalog seed data.

import {
  getSightingsForMovie,
  estimateTotalRatsForMovie,
  getMovieBySlug,
  getMovieByImdbId,
  getMovieByTitleSearch,
  getImdbTitleOptions,
  getSourceById,
  getRatCount,
  getRecentReviewActions,
  getHeroRecentSightings,
  movies,
  reviewActions,
} from "@/lib/whererat";

describe("getSightingsForMovie", () => {
  it("returns an empty array for a non-existent movie", () => {
    expect(getSightingsForMovie("does-not-exist")).toEqual([]);
  });

  it("returns sightings for an existing movie (if any exist)", () => {
    // If the catalog has movies, each result must match the movieId
    const firstMovie = movies[0];
    if (!firstMovie) return; // skip if catalog is empty
    const sightings = getSightingsForMovie(firstMovie.id);
    expect(Array.isArray(sightings)).toBe(true);
    for (const s of sightings) {
      expect(s.movieId).toBe(firstMovie.id);
    }
  });
});

describe("estimateTotalRatsForMovie", () => {
  it("returns 0 for a non-existent movie", () => {
    expect(estimateTotalRatsForMovie("does-not-exist")).toBe(0);
  });

  it("returns a number for any existing movie", () => {
    const firstMovie = movies[0];
    if (!firstMovie) return;
    expect(typeof estimateTotalRatsForMovie(firstMovie.id)).toBe("number");
  });
});

describe("getMovieBySlug", () => {
  it("returns undefined for a non-existent slug", () => {
    expect(getMovieBySlug("this-slug-does-not-exist-ever")).toBeUndefined();
  });

  it("returns the movie for an existing slug", () => {
    const firstMovie = movies[0];
    if (!firstMovie) return;
    const found = getMovieBySlug(firstMovie.slug);
    expect(found?.id).toBe(firstMovie.id);
  });
});

describe("getMovieByImdbId", () => {
  it("returns undefined for a non-existent IMDb ID", () => {
    expect(getMovieByImdbId("tt9999999")).toBeUndefined();
  });

  it("finds a movie by IMDb ID", () => {
    const firstMovie = movies[0];
    if (!firstMovie) return;
    const found = getMovieByImdbId(firstMovie.externalIds.imdb);
    expect(found?.id).toBe(firstMovie.id);
  });
});

describe("getMovieByTitleSearch", () => {
  it("returns undefined for an empty query", () => {
    expect(getMovieByTitleSearch("")).toBeUndefined();
  });

  it("returns undefined for a non-matching query", () => {
    expect(getMovieByTitleSearch("ZZZZZZNeverMatchAnything")).toBeUndefined();
  });

  it("finds a movie by exact title match", () => {
    const firstMovie = movies[0];
    if (!firstMovie) return;
    const found = getMovieByTitleSearch(firstMovie.title);
    expect(found).toBeDefined();
  });
});

describe("getImdbTitleOptions", () => {
  it("returns an array of label/value/imdbId objects", () => {
    const opts = getImdbTitleOptions();
    expect(Array.isArray(opts)).toBe(true);
    for (const opt of opts) {
      expect(opt).toHaveProperty("label");
      expect(opt).toHaveProperty("value");
      expect(opt).toHaveProperty("imdbId");
    }
  });
});

describe("getSourceById", () => {
  it("returns a source for a known ID", () => {
    const src = getSourceById("studio-watch-note");
    expect(src).toBeDefined();
    expect(src?.id).toBe("studio-watch-note");
  });

  it("returns undefined for unknown ID", () => {
    expect(getSourceById("unknown-source-id")).toBeUndefined();
  });
});

describe("getRatCount", () => {
  it("returns 0 for a non-existent movie", () => {
    expect(getRatCount("non-existent-movie")).toBe(0);
  });
});

describe("getRecentReviewActions", () => {
  it("returns an array", () => {
    expect(Array.isArray(getRecentReviewActions())).toBe(true);
  });

  it("sorts by reviewedAt descending when multiple actions exist", () => {
    // reviewActions is a mutable exported array — push temp entries then clean up
    const a1 = {
      id: "ra1",
      submissionId: "s1",
      movieTitle: "Film A",
      action: "approved" as const,
      moderatorId: "mod1",
      moderatorName: "Mod",
      reviewedAt: "2024-01-01T00:00:00Z",
      note: "",
    };
    const a2 = {
      id: "ra2",
      submissionId: "s2",
      movieTitle: "Film B",
      action: "rejected" as const,
      moderatorId: "mod1",
      moderatorName: "Mod",
      reviewedAt: "2024-06-01T00:00:00Z",
      note: "",
    };
    reviewActions.push(a1, a2);
    const result = getRecentReviewActions();
    expect(result[0].id).toBe("ra2"); // newer first
    // clean up
    reviewActions.splice(reviewActions.indexOf(a1), 1);
    reviewActions.splice(reviewActions.indexOf(a2), 1);
  });
});

describe("getHeroRecentSightings", () => {
  it("returns an array of at most `limit` entries", () => {
    const result = getHeroRecentSightings(3);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("each entry has sighting and movie fields", () => {
    const result = getHeroRecentSightings(5);
    for (const entry of result) {
      expect(entry).toHaveProperty("sighting");
      expect(entry).toHaveProperty("movie");
    }
  });
});


