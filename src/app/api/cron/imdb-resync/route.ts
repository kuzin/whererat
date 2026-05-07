import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { resyncAllCatalogMoviesFromImdb } from "@/lib/movie-imdb-sync";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/** Pro / Fluid: sync can run longer; Hobby is still capped (~10s) by the platform. */
export const maxDuration = 300;

const json = (payload: Record<string, unknown>, status: number) =>
  NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });

function cronSecret(): string {
  const fromVercel = process.env.CRON_SECRET?.trim() ?? "";
  if (fromVercel.length > 0) return fromVercel;
  /** Escape hatch if dashboard name was mistyped once; rarely needed. */
  return process.env.IMDB_CRON_SECRET?.trim() ?? "";
}

/** Parse `CRON_SYNC_BUDGET_MS`: unset → ~8s; negative → no budget (full catalog). */
function syncBudgetMsForCron(): number | undefined {
  const raw = process.env.CRON_SYNC_BUDGET_MS?.trim();
  if (raw === undefined || raw === "") return 8000;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 8000;
  if (n < 0) return undefined;
  return n;
}

function bearerToken(authHeader: string | null): string | null {
  if (!authHeader?.trim()) return null;
  const m = /^Bearer\s+([\s\S]+)$/i.exec(authHeader.trim());
  return m?.[1]?.trim() ?? null;
}

function verifyCronAuth(request: NextRequest): boolean {
  const secret = cronSecret();
  if (!secret) return false;

  const tokens = [
    bearerToken(request.headers.get("authorization")),
    bearerToken(request.headers.get("x-cron-authorization")),
  ].filter(Boolean) as string[];

  for (const token of tokens) {
    if (timingSafeBearerMatch(token, secret)) return true;
  }

  /**
   * Optional local / proxy testing (`CRON_ALLOW_QUERY_SECRET=1` only — never enable in prod without IP allowlist).
   */
  if (process.env.CRON_ALLOW_QUERY_SECRET === "1") {
    const q = request.nextUrl.searchParams.get("secret")?.trim();
    if (q && timingSafeBearerMatch(q, secret)) return true;
  }

  return false;
}

function timingSafeBearerMatch(token: string, secret: string): boolean {
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!cronSecret()) {
    return json(
      {
        ok: false,
        error:
          "Missing CRON_SECRET in this deployment. Edit the variable so it contains a secret (openssl rand -base64 24), redeploy Production, then try again.",
      },
      503,
    );
  }

  if (!verifyCronAuth(request)) {
    return json(
      {
        ok: false,
        error:
          "Unauthorized. Example: curl -H \"Authorization: Bearer $CRON_SECRET\" \"https://…/api/cron/imdb-resync\"",
      },
      401,
    );
  }

  try {
    const budgetMs = syncBudgetMsForCron();
    const rotationSeed = Math.floor(Date.now() / 86400000);
    const result = await resyncAllCatalogMoviesFromImdb({
      maxDurationMs: budgetMs,
      rotationSeed,
    });

    try {
      revalidatePath("/");
      revalidatePath("/movies/[slug]", "layout");
    } catch {
      /* revalidate ok to fail outside request context — best effort */
    }

    return json(
      {
        ok: true,
        ...result,
        budgetMs: budgetMs ?? "unlimited",
        rotationSeed,
        finishedAt: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resync failed";
    return json({ ok: false, error: message }, 500);
  }
}
