import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import {
  formatSubmissionEpisodeContext,
  formatApproximateRatLine,
  formatContentWarningLabel,
  formatSightingMomentDisplay,
  formatRuntimeMinutes,
  formatPercentAsTimestamp,
  getImdbTitleUrl,
  getSubmissionImageRefs,
  getSubmissionSightingTitle,
  CONTENT_WARNING_OPTIONS,
  RODENT_TYPE_OPTIONS,
} from "@/lib/whererat";
import { ModerationEditModal } from "./moderation-edit-modal";
import { InlineApproveForm } from "./inline-approve-form";
import { HistorySection } from "./history-section";
import { SubmissionImageThumbs } from "./submission-image-thumbs";
import { SightingMarkdown } from "@/components/sighting-markdown";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { moderateSubmission, removeSubmission, rereviewSubmission, resyncAllMovies } from "./actions";
import { readModerationStore } from "@/lib/moderation-store";
import {
  getCatalogMovieByImdbId,
  getCatalogMovieByTitleSearch,
  getCatalogStatsWithCommunity,
} from "@/lib/movie-catalog";
import { ResyncAllButton } from "./resync-all-button";
import { readUserStore } from "@/lib/user-store";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Moderation Queue",
  description:
    "Review pending submissions, approve or reject sightings, and manage catalog moderation activity.",
  robots: {
    index: false,
    follow: false,
  },
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const HISTORY_PAGE_SIZE = 20;

function fallbackAvatarUrl(_name: string) {
  return "/brand/rat.svg";
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const cookieStore = await cookies();
  const session = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/login?next=/moderation");
  }

  const store = await readModerationStore();
  const pendingSubmissions = store.submissions.filter(
    (submission) => submission.status === "pending",
  );
  const approvedSubmissions = store.submissions.filter(
    (submission) => submission.status === "approved",
  );
  const deniedSubmissions = store.submissions.filter(
    (submission) => submission.status === "rejected",
  );
  const params = searchParams ? await searchParams : {};
  const editingSubmissionId = single(params.edit);
  const pendingPageRaw = Number.parseInt(String(single(params.page) ?? "1"), 10);
  const requestedPendingPage =
    Number.isFinite(pendingPageRaw) && pendingPageRaw > 0 ? Math.floor(pendingPageRaw) : 1;
  const pendingPageCount = Math.max(1, Math.ceil(pendingSubmissions.length / HISTORY_PAGE_SIZE));
  const safePendingPage = Math.min(requestedPendingPage, pendingPageCount);
  const pendingStart = (safePendingPage - 1) * HISTORY_PAGE_SIZE;
  const pendingSlice = pendingSubmissions.slice(pendingStart, pendingStart + HISTORY_PAGE_SIZE);
  const pendingPath = (page: number) =>
    page <= 1 ? "/moderation" : `/moderation?page=${page}`;

  // Build reviewer lookup for all history items (both tabs)
  const allHistorySubmissions = [...approvedSubmissions, ...deniedSubmissions];
  const historyReviewerBySubmissionId = new Map<string, string>();
  for (const submission of allHistorySubmissions) {
    const isApproved = submission.status === "approved";
    const relevantActions = new Set(
      isApproved ? ["approved", "edited and approved"] : ["rejected"],
    );
    const latestAction = store.reviewActions
      .filter(
        (action) =>
          action.submissionId === submission.id && relevantActions.has(action.action),
      )
      .sort(
        (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
      )[0];
    if (latestAction?.moderatorName) {
      historyReviewerBySubmissionId.set(submission.id, latestAction.moderatorName);
    }
  }

  // Build view hrefs for all approved submissions
  const approvedViewEntries = await Promise.all(
    approvedSubmissions.map(async (submission) => {
      const movie =
        (submission.imdbId
          ? await getCatalogMovieByImdbId(submission.imdbId)
          : undefined) ?? (await getCatalogMovieByTitleSearch(submission.movieTitle));
      return movie ? ([submission.id, `/movies/${movie.slug}`] as const) : undefined;
    }),
  );
  const approvedViewHrefBySubmissionId = new Map<string, string>(
    approvedViewEntries.filter((e) => e !== undefined) as Array<readonly [string, string]>,
  );

  const approvedItems = approvedSubmissions.map((submission) => ({
    submission,
    reviewerName: historyReviewerBySubmissionId.get(submission.id),
    viewHref: approvedViewHrefBySubmissionId.get(submission.id),
  }));
  const deniedItems = deniedSubmissions.map((submission) => ({
    submission,
    reviewerName: historyReviewerBySubmissionId.get(submission.id),
  }));

  const editingSubmission =
    editingSubmissionId
      ? store.submissions.find((submission) => submission.id === editingSubmissionId)
      : undefined;
  const pendingMovieEntries = await Promise.all(
    pendingSlice.map(async (submission) => {
      const movie =
        (submission.imdbId
          ? await getCatalogMovieByImdbId(submission.imdbId)
          : undefined) ?? (await getCatalogMovieByTitleSearch(submission.movieTitle));
      return [submission.id, movie] as const;
    }),
  );
  const catalogMovieBySubmissionId = new Map(
    pendingMovieEntries.filter(([, movie]) => movie !== undefined),
  );

  const stats = await getCatalogStatsWithCommunity();
  const userStore = await readUserStore();
  const trustSignalAccounts = [...userStore.accounts]
    .map((account) => ({
      id: account.id,
      displayName: account.name,
      roleLabel: account.role === "owner" ? "Owner" : "Moderator",
      avatarUrl: account.avatarUrl || fallbackAvatarUrl(account.name),
      reviewCount: store.reviewActions.filter((action) => action.moderatorId === account.id).length,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount || a.displayName.localeCompare(b.displayName));
  return (
    <main className="wr-page-shell py-10">
      {session.role === "owner" ? (
        <details className="group mb-8 overflow-hidden rounded-2xl border border-amber-600/60 bg-amber-100/90 dark:border-amber-500/25 dark:bg-amber-950/15">
          <summary className="flex cursor-pointer select-none list-none items-center gap-3 p-5 text-amber-950 sm:p-6 dark:text-amber-100">
            <span aria-hidden className="text-xl">⚠</span>
            <span className="font-black text-amber-950 dark:text-amber-200">Owner Controls</span>
            <span className="ml-2 rounded-md border border-amber-600/70 bg-amber-200 px-2 py-0.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/40 dark:text-amber-300">
              Danger zone
            </span>
            <svg
              className="ml-auto h-4 w-4 shrink-0 text-amber-900 transition-transform group-open:rotate-180 dark:text-amber-400"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 10.94 2.53 5.47l1.06-1.06L8 8.82l4.41-4.41 1.06 1.06L8 10.94Z" />
            </svg>
          </summary>

          <div className="space-y-5 border-t border-amber-600/35 px-5 py-5 sm:px-6 dark:border-amber-500/20">
            {/* Stats row */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-400">
                Catalog stats
              </h3>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-amber-300/60 bg-white px-4 py-3 dark:border-amber-600/30 dark:bg-stone-900/60">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">Movies</dt>
                  <dd className="mt-1 text-2xl font-black text-stone-950 dark:text-stone-100">{stats.movies}</dd>
                </div>
                <div className="rounded-xl border border-amber-300/60 bg-white px-4 py-3 dark:border-amber-600/30 dark:bg-stone-900/60">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">Sightings approved</dt>
                  <dd className="mt-1 text-2xl font-black text-stone-950 dark:text-stone-100">{stats.sightings}</dd>
                </div>
              </dl>
            </div>

            {/* Resync action */}
            <div className="rounded-xl border border-amber-300/60 bg-white p-5 dark:border-amber-600/30 dark:bg-stone-900/60">
              <h3 className="font-black text-stone-950 dark:text-stone-100">Resync All Movies from IMDb</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                Pulls fresh metadata, ratings, poster URLs, and rat trivia from OMDb/IMDb for every movie in the catalog. Runs one movie at a time; full catalog may take minutes. Cron uses a short default time budget (~8s) plus daily rotation over the catalog (set{" "}
                <span className="font-mono text-xs">CRON_SYNC_BUDGET_MS=-1</span>{" "}
                on paid tiers for whole-catalog runs). Cron needs a non-empty{" "}
                <span className="font-mono text-xs">CRON_SECRET</span>{" "}
                plus Production redeploy.
              </p>
              <form action={resyncAllMovies} className="mt-4">
                <ResyncAllButton />
              </form>
            </div>
          </div>
        </details>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="contents lg:block lg:space-y-6">
          <div className="order-1 self-start rounded-2xl wr-panel-warm p-8">
            <img src="/openmoji/color/svg/1F50D.svg" alt="" width={56} height={56} aria-hidden />
            <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
              Moderation queue
            </h1>
            <p className="mt-5 leading-relaxed text-stone-800 dark:text-amber-100/90">
              Triage sightings with approve, tighten-up edits, or gentle rejections
              that explain why Netflix might not need another duplicate starting time.
            </p>
          </div>

          <div className="order-3 wr-card-soft space-y-3 p-6 sm:p-7">
            <h2 className="text-xl font-black text-stone-950 dark:text-stone-100">Queue health</h2>
            <dl className="mt-3 divide-y divide-stone-900/12 dark:divide-white/12">
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 font-bold text-stone-600 dark:text-stone-300">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500 dark:bg-yellow-400"
                  />
                  Pending
                </dt>
                <dd className="text-2xl font-black text-stone-950 dark:text-yellow-100">{pendingSubmissions.length}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 font-bold text-stone-600 dark:text-stone-300">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  />
                  Verified public
                </dt>
                <dd className="text-2xl font-black text-stone-950 dark:text-emerald-100">{stats.sightings}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 font-bold text-stone-600 dark:text-stone-300">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 dark:bg-rose-400"
                  />
                  Spoiler flags
                </dt>
                <dd className="text-2xl font-black text-stone-950 dark:text-rose-100">{stats.spoilerSightings}</dd>
              </div>
            </dl>
          </div>

          <div className="order-4 wr-card-soft space-y-3 p-6 sm:p-7">
            <h2 className="text-xl font-black text-stone-950 dark:text-stone-100">User trust signals</h2>
            <div className="mt-2 divide-y divide-stone-900/12 dark:divide-white/12">
              {trustSignalAccounts.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={user.avatarUrl}
                      alt={`${user.displayName} avatar`}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-xl border border-stone-900/12 object-cover dark:border-white/16"
                    />
                    <div>
                      <p className="font-black text-stone-950 dark:text-stone-100">{user.displayName}</p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">{user.roleLabel}</p>
                    </div>
                  </div>
                  <p className="flex items-baseline gap-1.5 text-right">
                    <span className="font-black text-stone-950 dark:text-stone-100">
                      {user.reviewCount}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      Reviews
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </aside>

        <section className="order-2 wr-card-soft p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Pending sightings
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {pendingSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-500/75 bg-stone-100/90 p-10 text-center dark:border-white/20 dark:bg-stone-900/40">
                <img src="/openmoji/color/svg/1F573.svg" alt="" width={40} height={40} className="mx-auto" aria-hidden />
                <h3 className="wr-display mt-3 text-2xl font-bold">
                  Quiet burrow. No crumbs.
                </h3>
                <p className="mt-2 text-stone-700 dark:text-stone-300">
                  New public submissions will appear here as pending reviews.
                </p>
              </div>
            ) : null}

            {pendingSlice.map((submission) => {
              const attachmentSlides = getSubmissionImageRefs(submission);
              const sightingTitle = getSubmissionSightingTitle(submission);
              const startingPretty = formatSightingMomentDisplay(submission.timestamp);
              const episodeContext = formatSubmissionEpisodeContext(submission);
              const isSeriesSubmission = submission.imdbKind === "series";
              const catalogMovie = catalogMovieBySubmissionId.get(submission.id);
              const posterUrl = catalogMovie?.posterUrl ?? submission.moviePosterUrl;
              return (
                <article
                  key={submission.id}
                  className="overflow-hidden rounded-2xl border-2 border-stone-900/80 bg-[var(--wr-surface-cream)] dark:border-white/20 dark:bg-stone-900/70"
                >
                  <div className="relative p-5">
                    <div className="pr-12">
                      <Link
                        href={`/moderation?edit=${submission.id}`}
                        className="wr-btn-ghost absolute top-5 right-5 inline-flex h-9 w-9 shrink-0 items-center justify-center px-0 text-lg"
                        aria-label="Edit submission"
                        title="Edit submission"
                      >
                        ✎
                      </Link>

                      {/* ── Movie block ── */}
                      <div className="flex gap-4">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={`${submission.movieTitle} poster`}
                            width={80}
                            height={120}
                            className="w-14 shrink-0 self-center rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 self-center">
                          <h3 className="text-xl font-black text-stone-950 dark:text-stone-100">
                            {submission.movieTitle}
                            {submission.movieYear ? (
                              <span className="ml-1.5 text-base font-semibold text-stone-500 dark:text-stone-400">
                                ({submission.movieYear})
                              </span>
                            ) : null}
                          </h3>
                          {episodeContext ? (
                            <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                              {episodeContext}
                            </p>
                          ) : null}
                          {catalogMovie ? (
                            <div className="mt-1 space-y-0.5 text-sm text-stone-600 dark:text-stone-400">
                              {catalogMovie.metadata.director ? (
                                <p>Dir. <span className="font-medium text-stone-800 dark:text-stone-200">{catalogMovie.metadata.director}</span></p>
                              ) : null}
                              {catalogMovie.genres.length > 0 ? (
                                <p>{catalogMovie.genres.join(" · ")}</p>
                              ) : null}
                              <p className="flex flex-wrap gap-x-3">
                                {catalogMovie.runtimeMinutes ? <span>{catalogMovie.runtimeMinutes} min</span> : null}
                                {catalogMovie.metadata.rating ? <span>{catalogMovie.metadata.rating}</span> : null}
                                {catalogMovie.metadata.imdbRating ? <span>★ {catalogMovie.metadata.imdbRating}</span> : null}
                              </p>
                            </div>
                          ) : null}
                          {/* ── Duplicate warning ── */}
                          {catalogMovie ? (
                            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-600/40 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
                              <img src="/openmoji/color/svg/26A0.svg" alt="Warning" width={16} height={16} className="mt-px shrink-0" aria-hidden />
                              <span>Already in catalog — verify this isn&apos;t a duplicate sighting before approving.</span>
                            </div>
                          ) : null}
                          {!catalogMovie ? (
                            <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                              {submission.imdbId ? (
                                <a href={getImdbTitleUrl(submission.imdbId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-950 underline decoration-orange-900/35 underline-offset-2 hover:decoration-orange-950 dark:text-amber-200 dark:decoration-amber-200/35 dark:hover:decoration-amber-200">
                                  IMDb {submission.imdbId}
                                  <ExternalLinkIcon className="size-3 opacity-60" />
                                </a>
                              ) : (
                                <span className="opacity-50">No IMDb match</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-stone-950/8 dark:border-white/8" />

                      {/* ── Sighting block ── */}
                      <dl className="mt-3 grid grid-cols-[10rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                        {episodeContext ? (
                          <>
                            <dt className="font-bold text-stone-600 dark:text-stone-400">Episode</dt>
                            <dd className="text-stone-700 dark:text-stone-200">{episodeContext}</dd>
                          </>
                        ) : null}
                        <dt className="font-bold text-stone-600 dark:text-stone-400">
                          Point in {isSeriesSubmission ? "episode" : "film"}
                        </dt>
                        <dd className="text-stone-700 dark:text-stone-200">
                          {startingPretty.replace(" into movie", "")}
                          {catalogMovie?.runtimeMinutes && (
                            <>
                              {" · "}
                              <span className="text-stone-500 dark:text-stone-400">
                                {formatPercentAsTimestamp(submission.timestamp, catalogMovie.runtimeMinutes) ?? "—"}
                              </span>
                            </>
                          )}
                        </dd>
                        <dt className="font-bold text-stone-600 dark:text-stone-400">Count</dt>
                        <dd className="text-stone-700 dark:text-stone-200">
                          ~{formatApproximateRatLine(submission.approximateRatCount, submission.rodentTypes)}
                        </dd>
                        {catalogMovie?.runtimeMinutes ? (
                          <>
                            <dt className="font-bold text-stone-600 dark:text-stone-400">Duration</dt>
                            <dd className="text-stone-700 dark:text-stone-200">{formatRuntimeMinutes(catalogMovie.runtimeMinutes)}</dd>
                          </>
                        ) : null}
                        {submission.imdbId ? (
                          <>
                            <dt className="font-bold text-stone-600 dark:text-stone-400">IMDb</dt>
                            <dd>
                              <a href={getImdbTitleUrl(submission.imdbId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-950 underline decoration-orange-900/35 underline-offset-2 hover:decoration-orange-950 dark:text-amber-200 dark:decoration-amber-200/35 dark:hover:decoration-amber-200">
                                {submission.imdbId}
                                <ExternalLinkIcon className="size-3 opacity-60" />
                              </a>
                            </dd>
                          </>
                        ) : null}
                        <dt className="font-bold text-stone-600 dark:text-stone-400">Submitted by</dt>
                        <dd className="text-stone-700 dark:text-stone-200">
                          {submission.submittedBy.trim()}
                          {submission.submitterEmail ? (
                            <>
                              {" · "}
                              <a
                                href={`mailto:${submission.submitterEmail}`}
                                className="font-semibold text-orange-950 underline decoration-orange-900/35 underline-offset-2 hover:decoration-orange-950 dark:text-amber-200 dark:decoration-amber-200/35 dark:hover:decoration-amber-200"
                              >
                                {submission.submitterEmail}
                              </a>
                            </>
                          ) : null}
                        </dd>
                        <dt className="font-bold text-stone-600 dark:text-stone-400">Submitted</dt>
                        <dd className="text-stone-700 dark:text-stone-200">
                          <time dateTime={submission.submittedAt.toISOString()}>
                            {submission.submittedAt.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              timeZoneName: "short",
                            })}
                          </time>
                        </dd>
                        {(() => {
                          const rodentTypes = submission.rodentTypes ?? [];
                          const warnings = submission.contentWarnings ?? [];
                          if (!submission.spoiler && rodentTypes.length === 0 && warnings.length === 0) return null;
                          return (
                            <>
                              <dt className="font-bold text-stone-600 dark:text-stone-400">Tags</dt>
                              <dd className="col-span-1">
                                <div className="flex flex-wrap gap-1.5">
                                  {rodentTypes.map((id) => {
                                    const opt = RODENT_TYPE_OPTIONS.find((o) => o.id === id);
                                    return (
                                      <span key={id} className="inline-flex items-center gap-1 rounded-md border border-amber-800/20 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:border-amber-400/25 dark:bg-amber-950/35 dark:text-amber-200">
                                        <img src={`/openmoji/color/svg/${opt?.openmojiCode ?? "26A0"}.svg`} alt="" width={14} height={14} aria-hidden />
                                        {opt?.label ?? id}
                                      </span>
                                    );
                                  })}
                                  {submission.spoiler ? (
                                    <span className="inline-flex items-center rounded-md border border-red-800/25 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-200">
                                      Spoiler
                                    </span>
                                  ) : null}
                                  {warnings.map((id) => {
                                    const opt = CONTENT_WARNING_OPTIONS.find((o) => o.id === id);
                                    return (
                                      <span key={id} className="inline-flex items-center gap-1 rounded-md border border-yellow-800/20 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-900 dark:border-yellow-400/25 dark:bg-yellow-950/35 dark:text-yellow-200">
                                        <img src={`/openmoji/color/svg/${opt?.openmojiCode ?? "26A0"}.svg`} alt="" width={14} height={14} aria-hidden />
                                        {formatContentWarningLabel(id, submission.rodentTypes)}
                                      </span>
                                    );
                                  })}
                                </div>
                              </dd>
                            </>
                          );
                        })()}
                      </dl>
                      {!catalogMovie && submission.imdbId ? (
                        <div className="mt-3 rounded-lg border border-stone-900/15 bg-stone-50 p-2.5 text-xs text-stone-700 dark:border-white/12 dark:bg-stone-900/30 dark:text-stone-300">
                          <p className="leading-relaxed">
                            <strong><img src="/openmoji/color/svg/1F4CC.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle" }} aria-hidden /> Note:</strong> This film is not yet in the catalog. Runtime data will be available once synced with IMDb (timestamp conversion requires duration). Approve to add it to the catalog.
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-3 border-t border-stone-950/8 pt-3 dark:border-white/8">
                        <p className="mb-1.5 text-sm font-bold text-stone-600 dark:text-stone-400">Title</p>
                        <p className="mb-3 text-sm text-stone-700 dark:text-stone-200">{sightingTitle}</p>
                        <p className="mb-1.5 text-sm font-bold text-stone-600 dark:text-stone-400">Description</p>
                        <SightingMarkdown markdown={submission.description} />
                      </div>
                    </div>

                    {attachmentSlides.length > 0 ? (
                      <div className="mt-4 overflow-hidden rounded-xl border border-stone-900/15 bg-stone-50 dark:border-white/12 dark:bg-stone-900/50">
                        <SubmissionImageThumbs slides={attachmentSlides} />
                      </div>
                    ) : null}

                    <div className="mt-5">
                      <InlineApproveForm
                        submissionId={submission.id}
                        moderateAction={moderateSubmission}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pendingPageCount > 1 ? (
            <div className="mt-8 flex items-center justify-between gap-3">
              <Link
                href={pendingPath(safePendingPage - 1)}
                className={`wr-btn-ghost ${safePendingPage === 1 ? "pointer-events-none opacity-40" : ""}`}
                aria-disabled={safePendingPage === 1}
              >
                ← Previous
              </Link>
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                Showing {pendingStart + 1}–{pendingStart + pendingSlice.length} of {pendingSubmissions.length}
              </p>
              <Link
                href={pendingPath(safePendingPage + 1)}
                className={`wr-btn-ghost ${safePendingPage === pendingPageCount ? "pointer-events-none opacity-40" : ""}`}
                aria-disabled={safePendingPage === pendingPageCount}
              >
                Next →
              </Link>
            </div>
          ) : null}

          <HistorySection
            approvedItems={approvedItems}
            deniedItems={deniedItems}
            rereviewAction={rereviewSubmission}
            removeAction={removeSubmission}
          />
        </section>
      </section>

      {editingSubmission ? (
        <ModerationEditModal
          submission={editingSubmission}
          moderateAction={moderateSubmission}
        />
      ) : null}
    </main>
  );
}
