import { describe, it, expect } from "vitest";
import {
  parseV1CatalogSort,
  parseV1Page,
  clampV1PageSize,
  V1_CATALOG_PAGE_DEFAULT,
  V1_CATALOG_PAGE_MAX,
} from "@/lib/api-v1/catalog";

describe("parseV1CatalogSort", () => {
  it("returns valid sort values unchanged", () => {
    expect(parseV1CatalogSort("latest-added-title")).toBe("latest-added-title");
    expect(parseV1CatalogSort("latest-sighting")).toBe("latest-sighting");
    expect(parseV1CatalogSort("most-rats-logged")).toBe("most-rats-logged");
    expect(parseV1CatalogSort("total-sightings")).toBe("total-sightings");
  });

  it("falls back to latest-added-title for unknown values", () => {
    expect(parseV1CatalogSort("unknown")).toBe("latest-added-title");
    expect(parseV1CatalogSort(null)).toBe("latest-added-title");
    expect(parseV1CatalogSort(undefined)).toBe("latest-added-title");
    expect(parseV1CatalogSort("")).toBe("latest-added-title");
  });
});

describe("parseV1Page", () => {
  it("parses valid page numbers", () => {
    expect(parseV1Page("1")).toBe(1);
    expect(parseV1Page("5")).toBe(5);
    expect(parseV1Page("100")).toBe(100);
  });

  it("falls back to the provided fallback for invalid values", () => {
    expect(parseV1Page(null)).toBe(1);
    expect(parseV1Page(undefined)).toBe(1);
    expect(parseV1Page("0")).toBe(1);
    expect(parseV1Page("-1")).toBe(1);
    expect(parseV1Page("abc")).toBe(1);
    expect(parseV1Page("")).toBe(1);
  });

  it("respects custom fallback", () => {
    expect(parseV1Page(null, 3)).toBe(3);
  });
});

describe("clampV1PageSize", () => {
  it("returns default for non-finite values", () => {
    expect(clampV1PageSize(NaN)).toBe(V1_CATALOG_PAGE_DEFAULT);
    expect(clampV1PageSize(Infinity)).toBe(V1_CATALOG_PAGE_DEFAULT);
  });

  it("clamps to minimum of 1", () => {
    expect(clampV1PageSize(0)).toBe(1);
    expect(clampV1PageSize(-5)).toBe(1);
    expect(clampV1PageSize(1)).toBe(1);
  });

  it("clamps to maximum", () => {
    expect(clampV1PageSize(V1_CATALOG_PAGE_MAX)).toBe(V1_CATALOG_PAGE_MAX);
    expect(clampV1PageSize(V1_CATALOG_PAGE_MAX + 1)).toBe(V1_CATALOG_PAGE_MAX);
    expect(clampV1PageSize(9999)).toBe(V1_CATALOG_PAGE_MAX);
  });

  it("floors fractional values", () => {
    expect(clampV1PageSize(10.9)).toBe(10);
    expect(clampV1PageSize(5.1)).toBe(5);
  });
});
