import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { resyncAllCatalogMoviesFromImdb } from "@/lib/movie-imdb-sync";

export const dynamic = "force-dynamic";

/** Hobby: 10s, Pro+: raise if catalog grows large. */
export const maxDuration = 300;

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  /**
   * Vercel Cron may send auth in alternate headers depending on runtime;
   * keep query fallback for manual invokes only when explicitly enabled.
   */
  if (process.env.CRON_ALLOW_QUERY_SECRET === "1") {
    const q = request.nextUrl.searchParams.get("secret");
    if (q && q === secret) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!verifyCronAuth(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resyncAllCatalogMoviesFromImdb();
    revalidatePath("/");
    revalidatePath("/movies/[slug]", "layout");

    return NextResponse.json({
      ok: true,
      ...result,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
