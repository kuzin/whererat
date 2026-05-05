import {
  movies,
  reviewActions,
  sightings,
  submissions,
} from "@/lib/whererat";
import { getModeratorAccounts } from "@/lib/auth";

export type PostgresSeed = {
  accounts: Array<{
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url: string;
    role: "owner" | "moderator";
    password_hash: string;
  }>;
  movies: Array<{
    id: string;
    slug: string;
    title: string;
    release_year: number;
    runtime_minutes: number;
    genres: string[];
    poster_tone: string;
    poster_url: string;
    backdrop_url: string;
    poster_alt: string;
    imdb_id: string;
    tmdb_id?: string;
    summary: string;
    metadata: Record<string, unknown>;
  }>;
  sightings: Array<{
    id: string;
    movie_id: string;
    timestamp_code: string;
    title?: string;
    description: string;
    prominence: string;
    scene_type: string;
    spoiler: boolean;
    confidence: string;
    verification_state: string;
    verified_by: string;
    source_ids: string[];
    curator_note?: string;
    approximate_rat_count?: number;
    submitter_name?: string;
    submission_reviewed_at?: string;
  }>;
  sighting_images: Array<{
    sighting_id: string;
    image_url: string;
    image_alt?: string;
    sort_order: number;
  }>;
  submissions: Array<{
    id: string;
    movie_title: string;
    movie_year?: number;
    imdb_id?: string;
    timestamp_code: string;
    title?: string;
    description: string;
    spoiler: boolean;
    approximate_rat_count: number;
    status: string;
    submitted_by: string;
    submitter_email?: string;
    curator_note?: string;
    duplicate_hint?: string;
    movie_poster_url?: string;
  }>;
  submission_images: Array<{
    submission_id: string;
    image_url: string;
    image_alt?: string;
    sort_order: number;
  }>;
  review_actions: Array<{
    id: string;
    submission_id: string;
    movie_title: string;
    action: string;
    moderator_id: string;
    moderator_name: string;
    reviewed_at: string;
    note: string;
  }>;
};

function toSightingImages(seed: typeof sightings): PostgresSeed["sighting_images"] {
  return seed.flatMap((sighting) => {
    const fromSlots = (sighting.images ?? []).map((slot, index) => ({
      sighting_id: sighting.id,
      image_url: slot.url,
      image_alt: slot.alt,
      sort_order: index,
    }));
    if (!sighting.imageUrl) return fromSlots;
    const alreadyHasLegacy =
      fromSlots.some((slot) => slot.image_url === sighting.imageUrl);
    if (alreadyHasLegacy) return fromSlots;
    return [
      ...fromSlots,
      {
        sighting_id: sighting.id,
        image_url: sighting.imageUrl,
        image_alt: sighting.imageAlt,
        sort_order: fromSlots.length,
      },
    ];
  });
}

function toSubmissionImages(seed: typeof submissions): PostgresSeed["submission_images"] {
  return seed.flatMap((submission) => {
    const fromSlots = (submission.images ?? []).map((slot, index) => ({
      submission_id: submission.id,
      image_url: slot.url,
      image_alt: slot.alt,
      sort_order: index,
    }));
    if (!submission.imageUrl) return fromSlots;
    const alreadyHasLegacy =
      fromSlots.some((slot) => slot.image_url === submission.imageUrl);
    if (alreadyHasLegacy) return fromSlots;
    return [
      ...fromSlots,
      {
        submission_id: submission.id,
        image_url: submission.imageUrl,
        image_alt: submission.imageAlt,
        sort_order: fromSlots.length,
      },
    ];
  });
}

/**
 * DB-ready seed projection from current in-repo seed structures.
 * Keeps app runtime unchanged while giving migration scripts a stable shape.
 */
export function buildPostgresSeed(): PostgresSeed {
  const submissionRows: PostgresSeed["submissions"] = submissions.map((submission) => ({
    id: submission.id,
    movie_title: submission.movieTitle,
    movie_year: submission.movieYear,
    imdb_id: submission.imdbId,
    timestamp_code: submission.timestamp,
    title: submission.title,
    description: submission.description,
    spoiler: submission.spoiler,
    approximate_rat_count: submission.approximateRatCount,
    status: submission.status,
    submitted_by: submission.submittedBy,
    submitter_email: submission.submitterEmail,
    curator_note: submission.curatorNote,
    duplicate_hint: submission.duplicateHint,
    movie_poster_url: submission.moviePosterUrl,
  }));
  const validSubmissionIds = new Set(submissionRows.map((row) => row.id));

  return {
    accounts: getModeratorAccounts().map((account) => ({
      id: account.id,
      username: account.username,
      display_name: account.name,
      email: account.email,
      avatar_url: account.avatarUrl,
      role: account.role,
      // Keep plaintext for local/dev migration bootstrap only.
      password_hash: account.password,
    })),
    movies: movies.map((movie) => ({
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      release_year: movie.releaseYear,
      runtime_minutes: movie.runtimeMinutes,
      genres: movie.genres,
      poster_tone: movie.posterTone,
      poster_url: movie.posterUrl,
      backdrop_url: movie.backdropUrl,
      poster_alt: movie.posterAlt,
      imdb_id: movie.externalIds.imdb,
      tmdb_id: movie.externalIds.tmdb,
      summary: movie.summary,
      metadata: movie.metadata,
    })),
    sightings: sightings.map((sighting) => ({
      id: sighting.id,
      movie_id: sighting.movieId,
      timestamp_code: sighting.timestamp,
      title: sighting.title,
      description: sighting.description,
      prominence: sighting.prominence,
      scene_type: sighting.sceneType,
      spoiler: sighting.spoiler,
      confidence: sighting.confidence,
      verification_state: sighting.verificationState,
      verified_by: sighting.verifiedBy,
      source_ids: sighting.sourceIds,
      curator_note: sighting.curatorNote,
      approximate_rat_count: sighting.approximateRatCount,
      submitter_name: sighting.submitterName,
      submission_reviewed_at: sighting.submissionReviewedAtISO,
    })),
    sighting_images: toSightingImages(sightings),
    submissions: submissionRows,
    submission_images: toSubmissionImages(submissions),
    review_actions: reviewActions
      .filter((action) => validSubmissionIds.has(action.submissionId))
      .map((action) => ({
        id: action.id,
        submission_id: action.submissionId,
        movie_title: action.movieTitle,
        action: action.action,
        moderator_id: action.moderatorId,
        moderator_name: action.moderatorName,
        reviewed_at: action.reviewedAt,
        note: action.note,
      })),
  };
}
