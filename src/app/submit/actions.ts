"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  canAutoApproveSubmissions,
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import {
  clampApproximateRatCount,
  normalizeImdbId,
  normalizeSightingTimestampInput,
  type SightingImageSlot,
} from "@/lib/whererat";
import { addSubmission, reviewSubmission } from "@/lib/moderation-store";
import { getCatalogMovieByImdbId, getCatalogMovieByTitleSearch } from "@/lib/movie-catalog";
import { persistSightingFiles } from "@/lib/media-storage";

// In-memory rate limiter. Resets on serverless cold starts — acceptable for now
// since we don't have Redis. Each entry tracks request count and expiry per IP.
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function isRateLimited(): Promise<boolean> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const now = Date.now();
  const entry = _rateLimitMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    _rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count++;
  return false;
}

const MAX_SIGHTING_UPLOAD_BYTES = 8 * 1024 * 1024;

function normalizeOptionalSubmitterEmail(value: unknown): string | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (raw.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return undefined;
  }
  return raw;
}

async function persistSightingUploads(formData: FormData): Promise<SightingImageSlot[]> {
  const raw = formData.getAll("sightingImages");
  const files = raw.filter((e): e is File => e instanceof File && e.size > 0);
  const capped = files.slice(0, 5);
  if (!capped.length) return [];
  return persistSightingFiles(capped, MAX_SIGHTING_UPLOAD_BYTES);
}

export async function submitSighting(formData: FormData) {
  if (await isRateLimited()) {
    redirect("/submit?status=rate-limited");
  }

  const selectedMovieTitle = String(formData.get("movieTitle") ?? "").trim();
  const movieTitle = selectedMovieTitle;
  const imdbId = normalizeImdbId(String(formData.get("imdbId") ?? ""));
  const movieYear = Number(formData.get("movieYear") || "");
  const moviePosterUrl = String(formData.get("moviePosterUrl") || "").trim();
  const sightingTitle = String(formData.get("sightingTitle") ?? "").trim();
  const timestamp = normalizeSightingTimestampInput(
    String(formData.get("timestamp") ?? ""),
  );
  const description = String(formData.get("description") ?? "").trim();
  const submitterName = String(formData.get("submitterName") ?? "").trim();
  const submitterEmail = normalizeOptionalSubmitterEmail(
    formData.get("submitterEmail"),
  );
  const spoiler = formData.get("spoiler") === "on";
  const approximateRatCount = clampApproximateRatCount(
    formData.get("approximateRatCount"),
  );
  const wantsAutoApprove = formData.get("autoApprove") === "on";
  const cookieStore = await cookies();
  const moderatorSession = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  const shouldAutoApprove =
    wantsAutoApprove && canAutoApproveSubmissions(moderatorSession);

  if (!movieTitle || !sightingTitle || !timestamp || !description || !submitterName) {
    redirect("/submit?status=missing");
  }

  if (!imdbId) {
    redirect("/submit?status=no-imdb");
  }

  const existingMovie =
    (imdbId ? await getCatalogMovieByImdbId(imdbId) : undefined) ??
    (await getCatalogMovieByTitleSearch(movieTitle));
  const duplicateHint = existingMovie ? `&match=${existingMovie.slug}` : "";

  const sightingImages = await persistSightingUploads(formData);
  const firstImage = sightingImages[0];

  const submission = await addSubmission({
    movieTitle,
    movieYear: Number.isFinite(movieYear) ? movieYear : undefined,
    imdbId: imdbId || undefined,
    timestamp,
    title: sightingTitle,
    description,
    spoiler,
    approximateRatCount,
    submittedBy: submitterName,
    submitterEmail,
    duplicateHint: existingMovie
      ? `Potential match in catalog: ${existingMovie.title}.`
      : imdbId
        ? "No existing catalog match found."
        : "No existing catalog match found.",
    moviePosterUrl:
      moviePosterUrl || existingMovie?.posterUrl || undefined,
    images: sightingImages.length ? sightingImages : undefined,
    imageUrl: firstImage?.url,
    imageAlt: firstImage?.alt,
  });

  if (shouldAutoApprove && moderatorSession) {
    await reviewSubmission({
      submissionId: submission.id,
      decision: "approved",
      moderator: moderatorSession,
    });
    redirect(`/submit?status=approved${duplicateHint}`);
  }

  redirect(`/submit?status=queued${duplicateHint}`);
}
