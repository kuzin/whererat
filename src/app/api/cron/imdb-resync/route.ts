import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { resyncAllCatalogMoviesFromImdb } from "@/lib/movie-imdb-sync";
import { runtimeEnvVar } from "@/lib/runtime-env";

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
  return (
    runtimeEnvVar("CR", "ON", "_", "SE", "CR", "ET") ??
    runtimeEnvVar("IM", "DB", "_", "CR", "ON", "_", "SE", "CR", "ET") ??
    ""
  );
}

/** Parse `CRON_SYNC_BUDGET_MS`: unset → ~8s; negative → no budget (full catalog). */
function syncBudgetMsForCron(): number | undefined {
  const raw = runtimeEnvVar("CR", "ON", "_", "SYNC", "_", "BUDGET", "_", "MS");
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
  if (
    runtimeEnvVar("CR", "ON", "_", "A", "LL", "OW", "_", "QU", "E", "RY", "_", "S", "E", "C", "R", "E", "T") === "1"
  ) {
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
          "Missing CRON_SECRET at runtime on this Lambda. Add it in Vercel → Settings → Environment Variables (Production), then redeploy. If it is already there, redeploy Production so the deployment picks up the value.",
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
