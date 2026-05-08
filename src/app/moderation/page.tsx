import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import {
  formatSubmissionEpisodeContext,
  formatSightingMomentDisplay,
  getSightingTimestampPercent,
  getImdbTitleUrl,
  getSubmissionImageRefs,
  getSubmissionSightingTitle,
} from "@/lib/whererat";
import { SightingImageCarousel } from "@/app/movies/[slug]/sighting-image-carousel";
import { SightingMarkdown } from "@/components/sighting-markdown";
import { EditableSightingImagesField } from "@/components/editable-sighting-images-field";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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
  const historyTabParam = single(params.historyTab);
  const historyTab = historyTabParam === "denied" ? "denied" : "approved";
  const historyPageRaw = Number.parseInt(String(single(params.historyPage) ?? "1"), 10);
  const requestedHistoryPage =
    Number.isFinite(historyPageRaw) && historyPageRaw > 0 ? Math.floor(historyPageRaw) : 1;
  const historyItems = historyTab === "denied" ? deniedSubmissions : approvedSubmissions;
  const historyPageCount = Math.max(1, Math.ceil(historyItems.length / HISTORY_PAGE_SIZE));
  const safeHistoryPage = Math.min(requestedHistoryPage, historyPageCount);
  const historyStart = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
  const historySlice = historyItems.slice(historyStart, historyStart + HISTORY_PAGE_SIZE);
  const pendingPageRaw = Number.parseInt(String(single(params.page) ?? "1"), 10);
  const requestedPendingPage =
    Number.isFinite(pendingPageRaw) && pendingPageRaw > 0 ? Math.floor(pendingPageRaw) : 1;
  const pendingPageCount = Math.max(1, Math.ceil(pendingSubmissions.length / HISTORY_PAGE_SIZE));
  const safePendingPage = Math.min(requestedPendingPage, pendingPageCount);
  const pendingStart = (safePendingPage - 1) * HISTORY_PAGE_SIZE;
  const pendingSlice = pendingSubmissions.slice(pendingStart, pendingStart + HISTORY_PAGE_SIZE);
  const pendingPath = (page: number) =>
    page <= 1 ? "/moderation" : `/moderation?page=${page}`;
  const historyReviewerBySubmissionId = new Map<string, string>();
  const relevantHistoryActions =
    historyTab === "approved"
      ? new Set(["approved", "edited and approved"])
      : new Set(["rejected"]);
  for (const submission of historySlice) {
    const latestAction = store.reviewActions
      .filter(
        (action) =>
          action.submissionId === submission.id &&
          relevantHistoryActions.has(action.action),
      )
      .sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
      )[0];
    if (latestAction?.moderatorName) {
      historyReviewerBySubmissionId.set(submission.id, latestAction.moderatorName);
    }
  }
  const approvedViewHrefBySubmissionId = new Map<string, string>();
  if (historyTab === "approved") {
    const approvedViewEntries = await Promise.all(
      historySlice.map(async (submission) => {
        const movie =
          (submission.imdbId
            ? await getCatalogMovieByImdbId(submission.imdbId)
            : undefined) ?? (await getCatalogMovieByTitleSearch(submission.movieTitle));
        return movie ? ([submission.id, `/movies/${movie.slug}`] as const) : undefined;
      }),
    );
    for (const entry of approvedViewEntries) {
      if (entry) approvedViewHrefBySubmissionId.set(entry[0], entry[1]);
    }
  }
  const historyPath = (tab: "approved" | "denied", page: number) => {
    const query = new URLSearchParams();
    query.set("historyTab", tab);
    if (page > 1) query.set("historyPage", String(page));
    return `/moderation?${query.toString()}`;
  };
  const editingSubmission =
    editingSubmissionId
      ? store.submissions.find((submission) => submission.id === editingSubmissionId)
      : undefined;
  const editingAttachmentSlides = editingSubmission
    ? getSubmissionImageRefs(editingSubmission)
    : [];
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
          <div className="order-1 self-start rounded-2xl border border-amber-500/35 wr-panel-warm p-8">
            <div className="text-4xl leading-none sm:text-5xl">
              <span aria-hidden>🔍</span>
            </div>
            <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
              Moderation queue
            </h1>
            <p className="mt-5 leading-relaxed text-orange-950">
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
                <p className="text-4xl">🕳️</p>
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
                className="overflow-hidden rounded-2xl border-2 border-stone-900/80 bg-[var(--wr-surface-cream)] dark:border-white/14 dark:bg-stone-900/70"
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
                        ) : (
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
                        )}
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
                      <dd className="text-stone-700 dark:text-stone-200">{startingPretty.replace(" into movie", "")}</dd>
                      <dt className="font-bold text-stone-600 dark:text-stone-400">Approx. rats</dt>
                      <dd className="text-stone-700 dark:text-stone-200">~{submission.approximateRatCount} {submission.approximateRatCount === 1 ? "rat" : "rats"}</dd>
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
                      {submission.spoiler ? (
                        <>
                          <dt className="font-bold text-stone-600 dark:text-stone-400">Spoiler</dt>
                          <dd className="font-semibold text-red-700 dark:text-red-400">Yes</dd>
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
                      <dt className="font-bold text-stone-600 dark:text-stone-400">Title</dt>
                      <dd className="text-stone-700 dark:text-stone-200">{sightingTitle}</dd>
                    </dl>
                    <div className="mt-3 border-t border-stone-950/8 pt-3 dark:border-white/8">
                      <p className="mb-1.5 text-sm font-bold text-stone-600 dark:text-stone-400">Description</p>
                      <SightingMarkdown markdown={submission.description} />
                    </div>
                </div>

                {attachmentSlides.length > 0 ? (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-stone-900/15 bg-stone-900/15 dark:border-white/14 dark:bg-stone-950/40">
                    <SightingImageCarousel slides={attachmentSlides} />
                    <p className="p-3 text-xs font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                      Attached sighting image{attachmentSlides.length > 1 ? "s" : ""}{" "}
                      ({attachmentSlides.length})
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3">
                  <form action={moderateSubmission} className="grid gap-3">
                    <input name="submissionId" type="hidden" value={submission.id} />
                    <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                      Curator message
                      <textarea
                        name="curatorNote"
                        rows={3}
                        defaultValue={submission.curatorNote ?? ""}
                        placeholder="Optional note shown with the published sighting."
                        className="wr-input h-auto min-h-24 resize-y py-3 leading-relaxed"
                      />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="wr-btn w-full bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500"
                      >
                        Approve
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="wr-btn w-full bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500"
                      >
                        Deny
                      </button>
                    </div>
                  </form>
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

          <div className="mt-10 border-t border-stone-900/15 pt-8 dark:border-white/12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-stone-950 dark:text-stone-100">
                  {historyTab === "approved" ? "Approved sightings" : "Denied sightings"}
                </h2>
              </div>
              <div className="inline-flex rounded-xl border border-stone-900/18 bg-white p-1 dark:border-white/12 dark:bg-stone-900/70">
                <Link
                  href={historyPath("approved", 1)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    historyTab === "approved"
                      ? "bg-stone-950 text-amber-100"
                      : "text-stone-700 dark:text-stone-200"
                  }`}
                >
                  Approved ({approvedSubmissions.length})
                </Link>
                <Link
                  href={historyPath("denied", 1)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    historyTab === "denied"
                      ? "bg-stone-950 text-amber-100"
                      : "text-stone-700 dark:text-stone-200"
                  }`}
                >
                  Denied ({deniedSubmissions.length})
                </Link>
              </div>
            </div>

            {historySlice.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-stone-500/75 bg-stone-100/90 p-8 text-center dark:border-white/20 dark:bg-stone-900/40">
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  No {historyTab} sightings yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {historySlice.map((submission) => (
                  <article
                    key={submission.id}
                    className="rounded-xl border border-stone-900/25 bg-stone-50 p-4 dark:border-white/12 dark:bg-stone-900/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-stone-950 dark:text-stone-100">
                          {getSubmissionSightingTitle(submission)}
                        </p>
                        <p className="text-sm text-stone-600 dark:text-stone-300">
                          {submission.movieTitle}
                          {submission.movieYear ? ` (${submission.movieYear})` : ""}
                          {formatSubmissionEpisodeContext(submission)
                            ? ` · ${formatSubmissionEpisodeContext(submission)}`
                            : ""}
                        </p>
                      </div>
                      <p
                        className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                          historyTab === "approved"
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/45 dark:text-emerald-100"
                            : "bg-red-100 text-red-900 dark:bg-red-900/45 dark:text-red-100"
                        }`}
                      >
                        {submission.status}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                      <SightingMarkdown markdown={submission.description} />
                    </div>
                    <div className="mt-4 border-t border-stone-900/10 pt-3 dark:border-white/10">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500">
                        {historyTab === "approved" ? "Approved" : "Denied"} by{" "}
                        {historyReviewerBySubmissionId.get(submission.id) ?? "Unknown"}
                      </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {historyTab === "approved" ? (
                        approvedViewHrefBySubmissionId.get(submission.id) ? (
                          <Link
                            href={approvedViewHrefBySubmissionId.get(submission.id)!}
                            className="wr-btn-ghost px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="rounded-md border border-stone-400/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-stone-500 dark:border-white/18 dark:text-stone-400">
                            View unavailable
                          </span>
                        )
                      ) : null}
                      <Link
                        href={`/moderation?edit=${submission.id}`}
                        className="wr-btn-ghost px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
                      >
                        Edit
                      </Link>
                      <form action={rereviewSubmission}>
                        <input type="hidden" name="submissionId" value={submission.id} />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={historyPath(historyTab, safeHistoryPage)}
                        />
                        <button
                          type="submit"
                          className="wr-btn-ghost border-emerald-700/35 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-950/35 dark:text-emerald-200 dark:hover:bg-emerald-950/45 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
                        >
                          Re-review
                        </button>
                      </form>
                      <form action={removeSubmission}>
                        <input type="hidden" name="submissionId" value={submission.id} />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={historyPath(historyTab, safeHistoryPage)}
                        />
                        <ConfirmSubmitButton
                          confirmMessage="Delete this submission permanently?"
                          type="submit"
                          className="wr-btn-ghost border-red-700/35 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-200 dark:hover:bg-red-950/45 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {historyPageCount > 1 ? (
              <div className="mt-5 flex items-center justify-between gap-3">
                <Link
                  href={historyPath(historyTab, Math.max(1, safeHistoryPage - 1))}
                  className={`wr-btn ${
                    safeHistoryPage === 1
                      ? "pointer-events-none bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-500"
                      : "bg-stone-950 text-amber-100"
                  }`}
                >
                  ← Previous
                </Link>
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  Page {safeHistoryPage} of {historyPageCount}
                </p>
                <Link
                  href={historyPath(historyTab, Math.min(historyPageCount, safeHistoryPage + 1))}
                  className={`wr-btn ${
                    safeHistoryPage === historyPageCount
                      ? "pointer-events-none bg-stone-300 text-stone-500 dark:bg-stone-800 dark:text-stone-500"
                      : "bg-stone-950 text-amber-100"
                  }`}
                >
                  Next →
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      {editingSubmission ? (
        <div className="fixed inset-0 z-[220] flex items-start justify-center bg-black/55 px-4 py-8 sm:py-12">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-stone-950/90 bg-[var(--wr-surface-cream)] p-6 shadow-[0_20px_60px_rgb(0_0_0/0.45)] dark:border-white/14 dark:bg-stone-900/95 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-stone-950 dark:text-stone-100">
                  {getSubmissionSightingTitle(editingSubmission)}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {editingSubmission.movieTitle}
                </p>
              </div>
              <Link
                href="/moderation"
                className="rounded-lg border border-stone-900/25 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/18 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Close
              </Link>
            </div>

            <form action={moderateSubmission} className="mt-6 grid gap-4">
              <input name="submissionId" type="hidden" value={editingSubmission.id} />
              <input name="imdbKind" type="hidden" value={editingSubmission.imdbKind ?? "movie"} />
              <input name="seasonNumber" type="hidden" value={editingSubmission.seasonNumber ?? ""} />
              <input name="episodeNumber" type="hidden" value={editingSubmission.episodeNumber ?? ""} />
              <input name="episodeTitle" type="hidden" value={editingSubmission.episodeTitle ?? ""} />
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Sighting title
                <input
                  name="sightingTitle"
                  required
                  defaultValue={getSubmissionSightingTitle(editingSubmission)}
                  className="wr-input"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Approx. point in {editingSubmission.imdbKind === "series" ? "episode" : "movie"}
                <input
                  name="timestamp"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={getSightingTimestampPercent(editingSubmission.timestamp) ?? 50}
                  className="accent-amber-700 dark:accent-amber-400"
                />
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Stored as a percentage into the {editingSubmission.imdbKind === "series" ? "episode" : "movie"}.
                </p>
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Approx. rats
                <input
                  name="approximateRatCount"
                  type="number"
                  min={1}
                  max={999}
                  required
                  defaultValue={editingSubmission.approximateRatCount}
                  className="wr-input tabular-nums"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Description
                <textarea
                  name="description"
                  required
                  rows={4}
                  defaultValue={editingSubmission.description}
                  className="wr-input h-auto min-h-24 resize-y py-3 leading-relaxed"
                />
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Markdown is supported (bold, lists, links, headings). It renders on movie pages.
                </span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Curator message
                <textarea
                  name="curatorNote"
                  rows={3}
                  defaultValue={editingSubmission.curatorNote ?? ""}
                  placeholder="Optional note shown with the published sighting."
                  className="wr-input h-auto min-h-24 resize-y py-3 leading-relaxed"
                />
              </label>
              <EditableSightingImagesField initialImages={editingAttachmentSlides} />
              <label className="flex items-center gap-3 rounded-2xl bg-amber-100 p-4 text-sm font-bold text-stone-700 dark:bg-amber-900/45 dark:text-amber-100">
                <input
                  name="spoiler"
                  type="checkbox"
                  defaultChecked={editingSubmission.spoiler}
                  className="h-5 w-5"
                />
                Contains spoilers
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/moderation"
                  className="wr-btn bg-white text-stone-900 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  name="decision"
                  value="edited"
                  className="wr-btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
