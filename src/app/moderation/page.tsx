import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  formatSightingMomentDisplay,
  getSightingTimestampPercent,
  getImdbTitleUrl,
  getSubmissionImageRefs,
  getSubmissionSightingTitle,
} from "@/lib/whererat";
import { SightingImageCarousel } from "@/app/movies/[slug]/sighting-image-carousel";
import { EditableSightingImagesField } from "@/components/editable-sighting-images-field";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { moderateSubmission } from "./actions";
import { readModerationStore } from "@/lib/moderation-store";
import {
  getCatalogMovieByImdbId,
  getCatalogMovieByTitleSearch,
  getCatalogStatsWithCommunity,
} from "@/lib/movie-catalog";
import { removeSubmission, rereviewSubmission } from "./actions";
import { readUserStore } from "@/lib/user-store";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const HISTORY_PAGE_SIZE = 20;

function fallbackAvatarUrl(_name: string) {
  return "/brand/mark.svg";
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
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-amber-500/35 bg-[#9a3412] p-8 text-[#fef3c7]">
            <h1 className="wr-display text-4xl font-bold tracking-tight">
              Moderation queue
            </h1>
            <p className="mt-5 leading-relaxed text-amber-50/82">
              Triage sightings with approve, tighten-up edits, or gentle rejections
              that explain why Netflix might not need another duplicate starting time.
            </p>
          </div>

          <div className="wr-card-soft space-y-3 p-6 sm:p-7">
            <h2 className="text-xl font-black text-stone-950 dark:text-stone-100">Queue health</h2>
            <dl className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-lg border border-stone-900/20 bg-[#fecdd3] px-4 py-3 dark:border-white/12 dark:bg-rose-950/45">
                <dt className="font-bold text-stone-600 dark:text-rose-200">Pending</dt>
                <dd className="text-2xl font-black text-stone-950 dark:text-rose-100">{pendingSubmissions.length}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-stone-900/18 bg-amber-200 px-4 py-3 dark:border-white/12 dark:bg-amber-900/45">
                <dt className="font-bold text-stone-600 dark:text-amber-200">Verified public</dt>
                <dd className="text-2xl font-black text-stone-950 dark:text-amber-100">{stats.sightings}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-stone-900/18 bg-yellow-50 px-4 py-3 dark:border-white/12 dark:bg-yellow-900/35">
                <dt className="font-bold text-stone-600 dark:text-yellow-200">Spoiler flags</dt>
                <dd className="text-2xl font-black text-stone-950 dark:text-yellow-100">{stats.spoilerSightings}</dd>
              </div>
            </dl>
          </div>

          <div className="wr-card-soft space-y-3 p-6 sm:p-7">
            <h2 className="text-xl font-black text-stone-950 dark:text-stone-100">User trust signals</h2>
            <div className="mt-4 space-y-3">
              {trustSignalAccounts.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 dark:bg-stone-900/70"
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
                  <p className="text-right">
                    <span className="block font-black text-stone-950 dark:text-stone-100">
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

        <section className="wr-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Pending sightings
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {pendingSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-400/65 bg-orange-50/70 p-10 text-center dark:border-white/20 dark:bg-orange-950/30">
                <p className="text-4xl">🕳️</p>
                <h3 className="wr-display mt-3 text-2xl font-bold">
                  Quiet burrow. No crumbs.
                </h3>
                <p className="mt-2 text-stone-600 dark:text-stone-300">
                  New public submissions will appear here as pending reviews.
                </p>
              </div>
            ) : null}

            {pendingSubmissions.map((submission) => {
              const attachmentSlides = getSubmissionImageRefs(submission);
              const sightingTitle = getSubmissionSightingTitle(submission);
              const startingPretty = formatSightingMomentDisplay(submission.timestamp);
              return (
              <article
                key={submission.id}
                className="overflow-hidden rounded-2xl border-2 border-stone-900/80 bg-[#fffaf5] dark:border-white/14 dark:bg-stone-900/70"
              >
                <div className="grid gap-0 md:grid-cols-[160px_1fr]">
                  <div className="bg-stone-950">
                    {submission.moviePosterUrl ? (
                      <Image
                        src={submission.moviePosterUrl}
                        alt={`${submission.movieTitle} submitted poster image`}
                        width={300}
                        height={450}
                        className="aspect-[2/3] h-56 w-full object-cover md:h-full md:min-h-[240px]"
                      />
                    ) : (
                      <div className="grid h-56 place-items-center p-6 text-center text-sm font-black uppercase tracking-[0.2em] text-amber-50 md:h-full md:min-h-[240px]">
                        No poster attached
                      </div>
                    )}
                  </div>
                  <div className="relative p-5">
                <div className="pr-12">
                    <h3 className="text-2xl font-black text-stone-950 dark:text-stone-100">{sightingTitle}</h3>
                    <Link
                      href={`/moderation?edit=${submission.id}`}
                      className="wr-btn-ghost absolute top-5 right-5 inline-flex h-9 w-9 shrink-0 items-center justify-center px-0 text-lg"
                      aria-label="Edit submission"
                      title="Edit submission"
                    >
                      ✎
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                      {submission.spoiler ? (
                        <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-800 dark:bg-red-950/45 dark:text-red-200">
                          Spoiler
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-base font-bold text-stone-800 dark:text-stone-200">
                      {submission.movieTitle}
                      {submission.movieYear ? ` (${submission.movieYear})` : ""}
                    </p>
                    <dl className="mt-3 grid grid-cols-[10rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                      <dt className="font-bold text-stone-600 dark:text-stone-400">
                        Approx. point in movie
                      </dt>
                      <dd className="text-stone-700 dark:text-stone-200 tabular-nums">
                        {startingPretty}
                      </dd>
                      <dt className="font-bold text-stone-600 dark:text-stone-400">IMDb</dt>
                      <dd className="text-stone-700 dark:text-stone-200">
                        {submission.imdbId ? (
                          <a
                            href={getImdbTitleUrl(submission.imdbId)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-orange-950 underline decoration-orange-900/35 underline-offset-2 hover:decoration-orange-950 dark:text-amber-200 dark:decoration-amber-200/35 dark:hover:decoration-amber-200"
                          >
                            View on IMDb ({submission.imdbId})
                          </a>
                        ) : (
                          "Manual title (IMDb match needed)"
                        )}
                      </dd>
                      <dt className="font-bold text-stone-600 dark:text-stone-400">Approx. rats</dt>
                      <dd className="text-stone-700 dark:text-stone-200">
                        {submission.approximateRatCount}{" "}
                        {submission.approximateRatCount === 1 ? "rat" : "rats"} on screen
                      </dd>
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
                    </dl>
                    <p className="mt-3 text-sm font-bold text-stone-600 dark:text-stone-400">
                      Description
                    </p>
                    <p className="mt-1 leading-7 text-stone-700 dark:text-stone-200">
                      {submission.description}
                    </p>
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
                        className="wr-input"
                      />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="wr-btn w-full bg-[#d97706] text-[#fffbeb]"
                      >
                        Approve
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="wr-btn w-full bg-[#dc2626] text-white"
                      >
                        Deny
                      </button>
                    </div>
                  </form>
                </div>
                  </div>
                </div>
              </article>
              );
            })}
          </div>

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
              <div className="mt-5 rounded-2xl border border-dashed border-stone-400/60 bg-stone-50/70 p-8 text-center dark:border-white/20 dark:bg-stone-900/40">
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  No {historyTab} sightings yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {historySlice.map((submission) => (
                  <article
                    key={submission.id}
                    className="rounded-xl border border-stone-900/15 bg-white p-4 dark:border-white/12 dark:bg-stone-900/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-stone-950 dark:text-stone-100">
                          {getSubmissionSightingTitle(submission)}
                        </p>
                        <p className="text-sm text-stone-600 dark:text-stone-300">
                          {submission.movieTitle}
                          {submission.movieYear ? ` (${submission.movieYear})` : ""}
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
                    <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                      {submission.description}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                      {historyTab === "approved" ? "Approved" : "Denied"} by{" "}
                      {historyReviewerBySubmissionId.get(submission.id) ?? "Unknown"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-stone-950/90 bg-[#fffaf5] p-6 shadow-[0_20px_60px_rgb(0_0_0/0.45)] dark:border-white/14 dark:bg-stone-900/95 sm:p-7">
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
                Approx. point in movie
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
                  Stored as a percentage into the movie.
                </p>
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Description
                <textarea
                  name="description"
                  required
                  rows={4}
                  defaultValue={editingSubmission.description}
                  className="wr-input"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Curator message
                <textarea
                  name="curatorNote"
                  rows={3}
                  defaultValue={editingSubmission.curatorNote ?? ""}
                  placeholder="Optional note shown with the published sighting."
                  className="wr-input"
                />
              </label>
              <EditableSightingImagesField initialImages={editingAttachmentSlides} />
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Approx. rats
                <input
                  name="approximateRatCount"
                  type="number"
                  min={1}
                  max={9999}
                  required
                  defaultValue={editingSubmission.approximateRatCount}
                  className="wr-input tabular-nums"
                />
              </label>
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
                  className="wr-btn bg-[#fb923c] text-stone-950 dark:border-amber-400/30 dark:bg-amber-700/80 dark:text-amber-50"
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
