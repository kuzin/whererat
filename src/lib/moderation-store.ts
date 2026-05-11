import {
  clampApproximateRatCount,
  normalizeImdbId,
  reviewActions as seedReviewActions,
  submissions as seedSubmissions,
  getSubmissionSightingTitle,
  type ReviewAction,
  type Sighting,
  type Submission,
} from "@/lib/whererat";
import type { ModeratorSession } from "@/lib/auth";
import { getDeletedSightingIds, getSightingOverrides } from "@/lib/sighting-edit-store";
import {
  ensureCommunityMovieForSubmission,
} from "@/lib/community-movie-store";
import {
  getCatalogMovieByImdbId,
  getCatalogMovieByTitleSearch,
} from "@/lib/movie-catalog";
import { getDbPool } from "@/lib/db";

type ReviewDecision = "approved" | "edited" | "edited and approved" | "rejected";
type SubmissionEdits = Partial<
  Pick<
    Submission,
    | "movieTitle"
    | "movieYear"
    | "title"
    | "imdbKind"
    | "seasonNumber"
    | "episodeNumber"
    | "episodeTitle"
    | "timestamp"
    | "description"
    | "spoiler"
    | "moviePosterUrl"
    | "approximateRatCount"
    | "imageUrl"
    | "imageAlt"
    | "images"
    | "submittedBy"
    | "submitterEmail"
    | "curatorNote"
    | "contentWarnings"
  >
>;

function normalizeSubmission(record: Submission): Submission {
  return {
    ...record,
    approximateRatCount: clampApproximateRatCount(record.approximateRatCount),
  };
}

const STORE_VERSION = 2;
let seededFromFixtures = false;

function toDbSubmission(row: {
  id: string;
  movie_title: string;
  movie_year: number | null;
  imdb_id: string | null;
  imdb_kind: "movie" | "series" | null;
  season_number: number | null;
  episode_number: number | null;
  episode_title: string | null;
  timestamp_code: string;
  title: string | null;
  description: string;
  spoiler: boolean;
  approximate_rat_count: number;
  status: Submission["status"];
  submitted_by: string;
  submitter_email: string | null;
  curator_note: string | null;
  duplicate_hint: string | null;
  movie_poster_url: string | null;
  images_json: unknown;
  content_warnings: string[] | null;
}): Submission {
  const images = Array.isArray(row.images_json)
    ? row.images_json
        .map((slot) => {
          if (!slot || typeof slot !== "object") return undefined;
          const rec = slot as { url?: unknown; alt?: unknown };
          const url = String(rec.url ?? "").trim();
          if (!url) return undefined;
          return {
            url,
            alt: rec.alt ? String(rec.alt) : undefined,
          };
        })
        .filter(
          (
            slot,
          ): slot is {
            url: string;
            alt: string | undefined;
          } => Boolean(slot),
        )
    : undefined;
  const leadImage = images?.[0];
  return {
    id: row.id,
    movieTitle: row.movie_title,
    movieYear: row.movie_year ?? undefined,
    imdbId: row.imdb_id ?? undefined,
    imdbKind: row.imdb_kind ?? undefined,
    seasonNumber: row.season_number ?? undefined,
    episodeNumber: row.episode_number ?? undefined,
    episodeTitle: row.episode_title ?? undefined,
    timestamp: row.timestamp_code,
    title: row.title ?? undefined,
    description: row.description,
    spoiler: row.spoiler,
    approximateRatCount: row.approximate_rat_count,
    status: row.status,
    submittedBy: row.submitted_by,
    submitterEmail: row.submitter_email ?? undefined,
    curatorNote: row.curator_note ?? undefined,
    duplicateHint: row.duplicate_hint ?? undefined,
    moviePosterUrl: row.movie_poster_url ?? undefined,
    imageUrl: leadImage?.url,
    imageAlt: leadImage?.alt,
    images,
    contentWarnings: (row.content_warnings?.length ? row.content_warnings : undefined) as string[] | undefined,
  };
}

function toDbReviewAction(row: {
  id: string;
  submission_id: string;
  movie_title: string;
  action: ReviewAction["action"];
  moderator_id: string;
  moderator_name: string;
  reviewed_at: string;
  note: string;
}): ReviewAction {
  return {
    id: row.id,
    submissionId: row.submission_id,
    movieTitle: row.movie_title,
    action: row.action,
    moderatorId: row.moderator_id,
    moderatorName: row.moderator_name,
    reviewedAt: row.reviewed_at,
    note: row.note,
  };
}

async function ensureSeedModerationStore() {
  if (seededFromFixtures) return;
  const pool = getDbPool();
  const countRes = await pool.query<{ count: string }>(
    "select count(*)::text as count from submissions",
  );
  const existingCount = Number(countRes.rows[0]?.count ?? "0") || 0;
  if (existingCount > 0) {
    seededFromFixtures = true;
    return;
  }
  for (const submission of seedSubmissions) {
    await pool.query(
      `insert into submissions
        (id, movie_title, movie_year, imdb_id, imdb_kind, season_number, episode_number, episode_title, timestamp_code, title, description, spoiler, approximate_rat_count, status, submitted_by, submitter_email, curator_note, duplicate_hint, movie_poster_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       on conflict (id) do nothing`,
      [
        submission.id,
        submission.movieTitle,
        submission.movieYear ?? null,
        submission.imdbId ?? null,
        submission.imdbKind ?? "movie",
        submission.seasonNumber ?? null,
        submission.episodeNumber ?? null,
        submission.episodeTitle ?? null,
        submission.timestamp,
        submission.title ?? null,
        submission.description,
        submission.spoiler,
        clampApproximateRatCount(submission.approximateRatCount),
        submission.status,
        submission.submittedBy,
        submission.submitterEmail ?? null,
        submission.curatorNote ?? null,
        submission.duplicateHint ?? null,
        submission.moviePosterUrl ?? null,
      ],
    );
    for (const [index, slot] of (submission.images ?? []).entries()) {
      await pool.query(
        `insert into submission_images (submission_id, image_url, image_alt, sort_order)
         values ($1,$2,$3,$4)
         on conflict (submission_id, sort_order) do update
           set image_url = excluded.image_url, image_alt = excluded.image_alt`,
        [submission.id, slot.url, slot.alt ?? null, index],
      );
    }
  }
  for (const action of seedReviewActions) {
    await pool.query(
      `insert into review_actions
        (id, submission_id, movie_title, action, moderator_id, moderator_name, reviewed_at, note)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do nothing`,
      [
        action.id,
        action.submissionId,
        action.movieTitle,
        action.action,
        action.moderatorId,
        action.moderatorName,
        action.reviewedAt,
        action.note,
      ],
    );
  }
  seededFromFixtures = true;
}

export async function readModerationStore() {
  await ensureSeedModerationStore();
  const pool = getDbPool();
  const [submissionRows, reviewRows] = await Promise.all([
    pool.query<{
      id: string;
      movie_title: string;
      movie_year: number | null;
      imdb_id: string | null;
      imdb_kind: "movie" | "series" | null;
      season_number: number | null;
      episode_number: number | null;
      episode_title: string | null;
      timestamp_code: string;
      title: string | null;
      description: string;
      spoiler: boolean;
      approximate_rat_count: number;
      status: Submission["status"];
      submitted_by: string;
      submitter_email: string | null;
      curator_note: string | null;
      duplicate_hint: string | null;
      movie_poster_url: string | null;
      images_json: unknown;
      content_warnings: string[] | null;
    }>(
      `select s.*,
              (
                select json_agg(json_build_object('url', si.image_url, 'alt', si.image_alt) order by si.sort_order)
                from submission_images si
                where si.submission_id = s.id
              ) as images_json
       from submissions s
       order by s.id asc`,
    ),
    pool.query<{
      id: string;
      submission_id: string;
      movie_title: string;
      action: ReviewAction["action"];
      moderator_id: string;
      moderator_name: string;
      reviewed_at: string;
      note: string;
    }>(
      `select id, submission_id, movie_title, action, moderator_id, moderator_name, reviewed_at, note
       from review_actions
       order by reviewed_at desc`,
    ),
  ]);
  return {
    version: STORE_VERSION,
    submissions: submissionRows.rows.map(toDbSubmission).map(normalizeSubmission),
    reviewActions: reviewRows.rows.map(toDbReviewAction),
  };
}

/** Sum `approximateRatCount` across moderator-approved submissions in the queue store */
export async function getApprovedSubmissionRatTally(): Promise<number> {
  const { submissions } = await readModerationStore();
  return submissions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + s.approximateRatCount, 0);
}

export async function addSubmission(
  submission: Omit<Submission, "id" | "status">,
) {
  await ensureSeedModerationStore();
  const pool = getDbPool();
  const nextSubmission: Submission = {
    ...submission,
    id: `sub-${crypto.randomUUID()}`,
    status: "pending",
    approximateRatCount: clampApproximateRatCount(submission.approximateRatCount),
  };
  await pool.query(
    `insert into submissions
      (id, movie_title, movie_year, imdb_id, imdb_kind, season_number, episode_number, episode_title, timestamp_code, title, description, spoiler, approximate_rat_count, status, submitted_by, submitter_email, curator_note, duplicate_hint, movie_poster_url, content_warnings)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [
      nextSubmission.id,
      nextSubmission.movieTitle,
      nextSubmission.movieYear ?? null,
      nextSubmission.imdbId ?? null,
      nextSubmission.imdbKind ?? "movie",
      nextSubmission.seasonNumber ?? null,
      nextSubmission.episodeNumber ?? null,
      nextSubmission.episodeTitle ?? null,
      nextSubmission.timestamp,
      nextSubmission.title ?? null,
      nextSubmission.description,
      nextSubmission.spoiler,
      nextSubmission.approximateRatCount,
      nextSubmission.status,
      nextSubmission.submittedBy,
      nextSubmission.submitterEmail ?? null,
      nextSubmission.curatorNote ?? null,
      nextSubmission.duplicateHint ?? null,
      nextSubmission.moviePosterUrl ?? null,
      nextSubmission.contentWarnings ?? [],
    ],
  );
  for (const [index, slot] of (nextSubmission.images ?? []).entries()) {
    await pool.query(
      `insert into submission_images (submission_id, image_url, image_alt, sort_order)
       values ($1,$2,$3,$4)`,
      [nextSubmission.id, slot.url, slot.alt ?? null, index],
    );
  }

  return nextSubmission;
}

function submissionApprovalTimestamp(
  reviewActions: ReviewAction[],
  submissionId: string,
): string | undefined {
  const approvals = reviewActions.filter(
    (r) =>
      r.submissionId === submissionId &&
      (r.action === "approved" || r.action === "edited and approved"),
  );
  if (approvals.length === 0) return undefined;
  return approvals.reduce((latest, r) =>
    new Date(r.reviewedAt).getTime() > new Date(latest.reviewedAt).getTime()
      ? r
      : latest,
  ).reviewedAt;
}

async function submissionToSyntheticSighting(
  submission: Submission,
  expectedMovieId: string,
  reviewedAtISO: string,
): Promise<Sighting | undefined> {
  const movie =
    (submission.imdbId
      ? await getCatalogMovieByImdbId(submission.imdbId)
      : undefined) ?? (await getCatalogMovieByTitleSearch(submission.movieTitle));
  if (!movie || movie.id !== expectedMovieId) return undefined;
  const name = submission.submittedBy.trim();
  const headline = getSubmissionSightingTitle(submission);
  return {
    id: `queue-${submission.id}`,
    movieId: movie.id,
    timestamp: submission.timestamp,
    title: headline,
    description: submission.description,
    prominence: "background",
    sceneType: "live-action",
    spoiler: submission.spoiler,
    confidence: "verified",
    verificationState: "verified",
    verifiedBy: name || "Community",
    sourceIds: [],
    approximateRatCount: submission.approximateRatCount,
    images: submission.images,
    imageUrl: submission.imageUrl,
    imageAlt: submission.imageAlt,
    submitterName: name || undefined,
    curatorNote: submission.curatorNote,
    submissionReviewedAtISO: reviewedAtISO,
    imdbKind: submission.imdbKind,
    seasonNumber: submission.seasonNumber,
    episodeNumber: submission.episodeNumber,
    episodeTitle: submission.episodeTitle,
    contentWarnings: submission.contentWarnings,
  };
}

/**
 * Static catalog sightings plus approved-queue rows resolved to catalog movies (by IMDb id or title).
 */
export async function getMergedSightingsForMovie(movieId: string): Promise<Sighting[]> {
  const pool = getDbPool();
  const [
    { submissions: storedSubs, reviewActions },
    baseRows,
    sightingOverrides,
    deletedSightingIds,
  ] =
    await Promise.all([
      readModerationStore(),
      pool.query<{
        id: string;
        movie_id: string;
        timestamp_code: string;
        title: string | null;
        description: string;
        prominence: Sighting["prominence"];
        scene_type: Sighting["sceneType"];
        spoiler: boolean;
        confidence: Sighting["confidence"];
        verification_state: Sighting["verificationState"];
        verified_by: string;
        source_ids: string[];
        curator_note: string | null;
        approximate_rat_count: number | null;
        submitter_name: string | null;
        submission_reviewed_at: string | null;
        content_warnings: string[] | null;
      }>(
        `select id, movie_id, timestamp_code, title, description, prominence, scene_type, spoiler, confidence, verification_state, verified_by, source_ids, curator_note, approximate_rat_count, submitter_name, submission_reviewed_at, content_warnings
         from sightings
         where movie_id = $1 and is_deleted = false`,
        [movieId],
      ),
      getSightingOverrides(),
      getDeletedSightingIds(),
    ]);
  const base: Sighting[] = baseRows.rows.map((row) => ({
    id: row.id,
    movieId: row.movie_id,
    timestamp: row.timestamp_code,
    title: row.title ?? undefined,
    description: row.description,
    prominence: row.prominence,
    sceneType: row.scene_type,
    spoiler: row.spoiler,
    confidence: row.confidence,
    verificationState: row.verification_state,
    verifiedBy: row.verified_by,
    sourceIds: row.source_ids,
    curatorNote: row.curator_note ?? undefined,
    approximateRatCount: row.approximate_rat_count ?? undefined,
    submitterName: row.submitter_name ?? undefined,
    submissionReviewedAtISO: row.submission_reviewed_at ?? undefined,
    contentWarnings: (row.content_warnings?.length ? row.content_warnings : undefined),
  }));

  const queueCandidates = storedSubs.filter((s) => s.status === "approved");
  const fromQueueResolved = await Promise.all(
    queueCandidates.map(async (s) => {
      const reviewedAt =
        submissionApprovalTimestamp(reviewActions, s.id) ?? new Date(0).toISOString();
      return submissionToSyntheticSighting(s, movieId, reviewedAt);
    }),
  );
  const fromQueue = fromQueueResolved.filter((item): item is Sighting => Boolean(item));

  return [...base, ...fromQueue]
    .filter((sighting) => !deletedSightingIds.has(sighting.id))
    .map((sighting) => ({
      ...sighting,
      ...(sightingOverrides[sighting.id] ?? {}),
    }));
}

export async function reviewSubmission({
  submissionId,
  decision,
  moderator,
  reason,
  edits,
}: {
  submissionId: string;
  decision: ReviewDecision;
  moderator: ModeratorSession;
  reason?: string;
  edits?: SubmissionEdits;
}) {
  const state = await readModerationStore();
  const submission = state.submissions.find((item) => item.id === submissionId);

  if (!submission) {
    return;
  }

  const status: Submission["status"] =
    decision === "rejected"
      ? "rejected"
      : decision === "edited"
        ? "pending"
        : "approved";
  const reviewedAt = new Date().toISOString();
  const defaultNoteByDecision: Record<ReviewDecision, string> = {
    approved: "Approved and promoted out of the pending queue.",
    edited: "Edited in moderation and kept in pending queue.",
    "edited and approved": "Edited by a moderator, then approved.",
    rejected: "Rejected and removed from the pending queue.",
  };
  const reviewNote = reason?.trim() || defaultNoteByDecision[decision];
  const merged: Submission = {
    ...submission,
    ...edits,
    status,
  };
  const reviewedSubmission: Submission = {
    ...merged,
    approximateRatCount: clampApproximateRatCount(merged.approximateRatCount),
  };

  const lookupImdb = normalizeImdbId(reviewedSubmission.imdbId ?? "");
  const existingCatalogMovie =
    (lookupImdb ? await getCatalogMovieByImdbId(lookupImdb) : undefined) ??
    (await getCatalogMovieByTitleSearch(reviewedSubmission.movieTitle));
  if (
    (decision === "approved" || decision === "edited and approved") &&
    !existingCatalogMovie
  ) {
    await ensureCommunityMovieForSubmission(reviewedSubmission);
  }

  const nextReviewAction: ReviewAction = {
    id: `review-${crypto.randomUUID()}`,
    submissionId,
    movieTitle: reviewedSubmission.movieTitle,
    action: decision,
    moderatorId: moderator.id,
    moderatorName: moderator.name,
    reviewedAt,
    note: reviewNote,
  };

  const pool = getDbPool();
  await pool.query(
    `update submissions
        set movie_title = $2,
            movie_year = $3,
            imdb_id = $4,
            imdb_kind = $5,
            season_number = $6,
            episode_number = $7,
            episode_title = $8,
            timestamp_code = $9,
            title = $10,
            description = $11,
            spoiler = $12,
            approximate_rat_count = $13,
            status = $14,
            submitted_by = $15,
            submitter_email = $16,
            curator_note = $17,
            duplicate_hint = $18,
            movie_poster_url = $19,
            content_warnings = $20,
            updated_at = now()
      where id = $1`,
    [
      reviewedSubmission.id,
      reviewedSubmission.movieTitle,
      reviewedSubmission.movieYear ?? null,
      reviewedSubmission.imdbId ?? null,
      reviewedSubmission.imdbKind ?? "movie",
      reviewedSubmission.seasonNumber ?? null,
      reviewedSubmission.episodeNumber ?? null,
      reviewedSubmission.episodeTitle ?? null,
      reviewedSubmission.timestamp,
      reviewedSubmission.title ?? null,
      reviewedSubmission.description,
      reviewedSubmission.spoiler,
      reviewedSubmission.approximateRatCount,
      reviewedSubmission.status,
      reviewedSubmission.submittedBy,
      reviewedSubmission.submitterEmail ?? null,
      reviewedSubmission.curatorNote ?? null,
      reviewedSubmission.duplicateHint ?? null,
      reviewedSubmission.moviePosterUrl ?? null,
      reviewedSubmission.contentWarnings ?? [],
    ],
  );
  await pool.query(
    `delete from submission_images where submission_id = $1`,
    [reviewedSubmission.id],
  );
  for (const [index, slot] of (reviewedSubmission.images ?? []).entries()) {
    await pool.query(
      `insert into submission_images (submission_id, image_url, image_alt, sort_order)
       values ($1,$2,$3,$4)`,
      [reviewedSubmission.id, slot.url, slot.alt ?? null, index],
    );
  }
  await pool.query(
    `insert into review_actions
      (id, submission_id, movie_title, action, moderator_id, moderator_name, reviewed_at, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      nextReviewAction.id,
      nextReviewAction.submissionId,
      nextReviewAction.movieTitle,
      nextReviewAction.action,
      nextReviewAction.moderatorId,
      nextReviewAction.moderatorName,
      nextReviewAction.reviewedAt,
      nextReviewAction.note,
    ],
  );
}

export async function deleteSubmissionById(submissionId: string) {
  const pool = getDbPool();
  await pool.query(`delete from submissions where id = $1`, [submissionId]);
}
