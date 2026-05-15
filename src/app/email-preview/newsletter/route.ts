import { NextResponse } from "next/server";
import { buildNewsletterEmail } from "@/lib/news-notify";
import { assertPreviewAllowed, wrapWithPreviewNav, PREVIEW_BASE_URL } from "../_fixtures";

export const dynamic = "force-dynamic";

const FAKE_NEWS_ITEM = {
  id: "preview-news-001",
  title: "Dark fur detected in Paddington",
  body: "A WhereRat community member has submitted a fresh sighting from the 2014 film Paddington. Look out for a grey blur darting across the bakery floor at around the 23-minute mark. Small, fast, unmistakable. Head to the catalog to see the full entry.",
  type: "community" as const,
  imageUrl: null,
  imageAlt: null,
  imagePositionX: 50,
  imagePositionY: 50,
  imageZoom: 1,
  authorId: "author-1",
  authorName: "WhereRat",
  authorAvatarUrl: "",
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FAKE_UNSUBSCRIBE_TOKEN = "preview-token-abc123";

export async function GET() {
  assertPreviewAllowed();
  const { html } = buildNewsletterEmail(FAKE_NEWS_ITEM, FAKE_UNSUBSCRIBE_TOKEN, PREVIEW_BASE_URL);
  return new NextResponse(wrapWithPreviewNav(html, "newsletter"), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
