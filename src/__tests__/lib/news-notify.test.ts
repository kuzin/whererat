import { describe, expect, it } from "vitest";

import {
  buildNewsletterDigestEmail,
  defaultDigestSubject,
} from "@/lib/news-notify";
import type { NewsItem } from "@/lib/news-store";

function fixtureNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: "news-1",
    title: "Hello rat fans",
    body: "Line one\nLine two",
    type: "announcement",
    imageUrl: null,
    imageAlt: null,
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
    authorId: "admin",
    authorName: "Admin",
    authorAvatarUrl: "",
    publishedAt: new Date("2026-05-01T00:00:00Z"),
    createdAt: new Date("2026-05-01T00:00:00Z"),
    updatedAt: new Date("2026-05-01T00:00:00Z"),
    ...overrides,
  };
}

describe("defaultDigestSubject", () => {
  it("returns a generic subject when no items are selected", () => {
    expect(defaultDigestSubject([])).toBe("WhereRat news");
  });

  it("uses the single post title when only one item is selected", () => {
    expect(defaultDigestSubject([fixtureNewsItem({ title: "Big news" })])).toBe(
      "Big news",
    );
  });

  it("uses a digest line for multiple items", () => {
    const items = [
      fixtureNewsItem({ id: "a", title: "A" }),
      fixtureNewsItem({ id: "b", title: "B" }),
      fixtureNewsItem({ id: "c", title: "C" }),
    ];
    expect(defaultDigestSubject(items)).toBe("WhereRat — 3 new posts");
  });
});

describe("buildNewsletterDigestEmail", () => {
  it("uses the caller-provided subject verbatim", () => {
    const result = buildNewsletterDigestEmail(
      [fixtureNewsItem()],
      "tok",
      "Custom subject",
    );
    expect(result.subject).toBe("Custom subject");
  });

  it("renders each item's title in the HTML", () => {
    const items = [
      fixtureNewsItem({ id: "a", title: "First story" }),
      fixtureNewsItem({ id: "b", title: "Second story" }),
    ];
    const result = buildNewsletterDigestEmail(items, "tok", "Two items");
    expect(result.html).toContain("First story");
    expect(result.html).toContain("Second story");
  });

  it("includes an unsubscribe link bound to the token", () => {
    const result = buildNewsletterDigestEmail(
      [fixtureNewsItem()],
      "abc123",
      "Subj",
    );
    expect(result.html).toContain("token=abc123");
    expect(result.html).toContain("Unsubscribe");
  });

  it("renders dividers between items in the plain-text version", () => {
    const items = [
      fixtureNewsItem({ id: "a", title: "Alpha" }),
      fixtureNewsItem({ id: "b", title: "Bravo" }),
      fixtureNewsItem({ id: "c", title: "Charlie" }),
    ];
    const result = buildNewsletterDigestEmail(items, "tok", "Three");
    // Dividers render as "---" in the plain-text body — 3 items → 2 dividers.
    const dividerCount = (result.text.match(/^---$/gm) ?? []).length;
    expect(dividerCount).toBe(2);
  });
});
