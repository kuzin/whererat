"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canAutoApproveSubmissions,
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import {
  clampApproximateRatCount,
  normalizeImdbId,
  type SightingImageSlot,
} from "@/lib/whererat";
import { addSubmission, reviewSubmission } from "@/lib/moderation-store";
import { getCatalogMovieByImdbId, getCatalogMovieByTitleSearch } from "@/lib/movie-catalog";

const SIGHTING_IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

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

  const dir = path.join(process.cwd(), "public", "uploads", "sightings");
  await mkdir(dir, { recursive: true });

  const out: SightingImageSlot[] = [];

  for (const file of capped) {
    const ext = SIGHTING_IMAGE_MIME_EXT[file.type];
    if (!ext || file.size > MAX_SIGHTING_UPLOAD_BYTES) continue;
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const name = `${crypto.randomUUID()}${ext}`;
      await writeFile(path.join(dir, name), buf);
      const safeStem = file.name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 96);
      out.push({
        url: `/uploads/sightings/${name}`,
        alt: safeStem ? `${safeStem} (uploaded)` : "Uploaded sighting photo",
      });
    } catch {
      continue;
    }
  }

  return out.slice(0, 5);
}

export async function submitSighting(formData: FormData) {
  const selectedMovieTitle = String(formData.get("movieTitle") ?? "").trim();
  const movieTitle = selectedMovieTitle;
  const imdbId = normalizeImdbId(String(formData.get("imdbId") ?? ""));
  const movieYear = Number(formData.get("movieYear") || "");
  const moviePosterUrl = String(formData.get("moviePosterUrl") || "").trim();
  const sightingTitle = String(formData.get("sightingTitle") ?? "").trim();
  const timestamp = String(formData.get("timestamp") ?? "").trim();
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
