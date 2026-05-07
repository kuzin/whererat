import { NextResponse, type NextRequest } from "next/server";
import {
  getV1CatalogJson,
  parseV1CatalogSort,
  parseV1Page,
  V1_CATALOG_PAGE_DEFAULT,
  clampV1PageSize,
} from "@/lib/api-v1/catalog";

export const dynamic = "force-dynamic";

const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const genre = (url.searchParams.get("genre") ?? "all").trim();
  const sort = parseV1CatalogSort(url.searchParams.get("sort"));
  const page = parseV1Page(url.searchParams.get("page"), 1);
  const pageSizeRaw = url.searchParams.get("pageSize");
  const pageSizeNum = pageSizeRaw
    ? Number.parseInt(pageSizeRaw, 10)
    : V1_CATALOG_PAGE_DEFAULT;
  const pageSize = clampV1PageSize(pageSizeNum);

  const body = await getV1CatalogJson({
    query,
    genre: genre || "all",
    sort,
    page,
    pageSize,
  });

  return NextResponse.json(body, {
    headers: { "Cache-Control": CACHE_HEADER },
  });
}
