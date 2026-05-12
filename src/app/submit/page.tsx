import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  canAutoApproveSubmissions,
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { getCatalogMovieByImdbId } from "@/lib/movie-catalog";
import { submitSighting } from "./actions";
import { SubmitForm } from "./submit-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Submit a Rodent Sighting",
  description:
    "Submit a new rat sighting with movie match, timestamp, spoiler flag, and optional screenshot.",
  alternates: {
    canonical: "/submit",
  },
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readSeriesYearRange(snapshot: Record<string, unknown> | undefined): string | undefined {
  const raw =
    typeof snapshot?.Year === "string"
      ? snapshot.Year
      : typeof snapshot?.year === "string"
        ? snapshot.year
        : "";
  const cleaned = raw.trim();
  if (!cleaned) return undefined;
  return cleaned.replace("-", "–");
}

function readSeriesTotalSeasons(snapshot: Record<string, unknown> | undefined): number | undefined {
  const raw = snapshot?.totalSeasons ?? snapshot?.TotalSeasons;
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

function readSeriesTotalEpisodes(snapshot: Record<string, unknown> | undefined): number | undefined {
  const raw = snapshot?.totalEpisodes ?? snapshot?.TotalEpisodes ?? snapshot?.episodeCount;
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const status = single(params.status);

  const forImdbId = single(params.for)?.trim();
  const forTitle = single(params.title)?.trim();
  const forYear = single(params.year)?.trim();
  const forPoster = single(params.poster)?.trim();
  const catalogMovie = forImdbId ? await getCatalogMovieByImdbId(forImdbId) : undefined;
  const syncSnapshot = catalogMovie?.metadata.syncSnapshot as Record<string, unknown> | undefined;
  const isCatalogSeries =
    typeof syncSnapshot?.Type === "string" &&
    syncSnapshot.Type.trim().toLowerCase() === "series";
  const initialMovie = forImdbId
    ? {
        imdbId: forImdbId,
        title: catalogMovie?.title ?? forTitle ?? "",
        year: String(catalogMovie?.releaseYear ?? forYear ?? ""),
        yearRange: isCatalogSeries ? readSeriesYearRange(syncSnapshot) : undefined,
        posterUrl: catalogMovie?.posterUrl ?? forPoster ?? "",
        kind: isCatalogSeries ? ("series" as const) : ("movie" as const),
        runtime: isCatalogSeries
          ? undefined
          : catalogMovie?.runtimeMinutes
            ? `${catalogMovie.runtimeMinutes} min`
            : undefined,
        rating: catalogMovie?.metadata.rating || undefined,
        imdbRating: catalogMovie?.metadata.imdbRating || undefined,
        totalSeasons: isCatalogSeries ? readSeriesTotalSeasons(syncSnapshot) : undefined,
        totalEpisodes: isCatalogSeries ? readSeriesTotalEpisodes(syncSnapshot) : undefined,
      }
    : undefined;

  const cookieStore = await cookies();
  const moderatorSession = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  const canAutoApprove = canAutoApproveSubmissions(moderatorSession);

  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="self-start rounded-2xl wr-panel-warm p-8">
          <div className="text-4xl leading-none sm:text-5xl">
            <span aria-hidden>🐀</span>
          </div>
          <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
            Submit a rodent sighting
          </h1>
          <p className="mt-5 leading-relaxed text-stone-800 dark:text-amber-100/90">
            Pick the movie, mark where it happens, and describe what you saw. Moderators review every
            submission before it goes live.{" "}
            <a
              href="/guidelines"
              className="font-semibold underline underline-offset-2 hover:text-orange-900 dark:hover:text-amber-100"
            >
              Read the guidelines →
            </a>
          </p>
        </aside>

        <div className="wr-card-soft p-7 sm:p-8">
          {status === "no-imdb" ? (
            <div className="mb-6 rounded-xl border border-amber-800/35 bg-amber-50 p-4 text-sm font-medium text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/45 dark:text-amber-100">
              Choose a movie from the search dropdown so we store a real{" "}
              <span className="font-bold">IMDb title ID</span> (tt…) and poster.
              Free‑typed titles alone aren’t enough.
            </div>
          ) : null}
          {status === "rate-limited" ? (
            <div className="mb-6 rounded-xl border border-red-800/35 bg-red-50 p-4 text-sm font-medium text-red-900 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
              Too many submissions. Please wait before submitting again.
            </div>
          ) : null}
          <SubmitForm
            submitAction={submitSighting}
            canAutoApprove={canAutoApprove}
            moderatorName={moderatorSession?.name}
            loggedInName={moderatorSession?.name}
            loggedInEmail={moderatorSession?.email}
            initialMovie={initialMovie}
          />
        </div>
      </section>
    </main>
  );
}
