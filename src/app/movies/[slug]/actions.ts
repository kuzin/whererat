"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import {
  clampApproximateRatCount,
  type SightingImageSlot,
} from "@/lib/whererat";
import {
  clearMovieOverride,
  deleteMovieById,
  updateMovieOverride,
} from "@/lib/movie-edit-store";
import { reviewSubmission } from "@/lib/moderation-store";
import { deleteSightingById, updateSightingOverride } from "@/lib/sighting-edit-store";
import { getCatalogMovieBySlug } from "@/lib/movie-catalog";
import { persistSightingFiles } from "@/lib/media-storage";

const MAX_SIGHTING_UPLOAD_BYTES = 8 * 1024 * 1024;

async function requireModerator() {
  const cookieStore = await cookies();
  const session = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  if (!session) {
    redirect("/login");
  }
  return session;
}

async function persistSightingUploads(formData: FormData): Promise<SightingImageSlot[]> {
  const raw = formData.getAll("sightingImages");
  const files = raw.filter((e): e is File => e instanceof File && e.size > 0);
  const capped = files.slice(0, 5);
  if (!capped.length) return [];
  return persistSightingFiles(capped, MAX_SIGHTING_UPLOAD_BYTES);
}

export async function updateMovieInfo(formData: FormData) {
  await requireModerator();

  const slug = String(formData.get("slug") ?? "").trim();
  const movie = await getCatalogMovieBySlug(slug);
  if (!movie) redirect("/#catalog");

  const genresRaw = String(formData.get("genres") ?? "").trim();
  const countriesRaw = String(formData.get("countries") ?? "").trim();

  await updateMovieOverride(movie.id, {
    title: String(formData.get("title") ?? "").trim() || movie.title,
    releaseYear: Number(formData.get("releaseYear") ?? movie.releaseYear),
    runtimeMinutes: Number(formData.get("runtimeMinutes") ?? movie.runtimeMinutes),
    summary: String(formData.get("summary") ?? "").trim() || movie.summary,
    posterUrl: String(formData.get("posterUrl") ?? "").trim() || movie.posterUrl,
    backdropUrl: String(formData.get("backdropUrl") ?? "").trim() || movie.backdropUrl,
    genres: genresRaw
      ? genresRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : movie.genres,
    metadata: {
      ...movie.metadata,
      tagline: String(formData.get("tagline") ?? "").trim(),
      rating: String(formData.get("rating") ?? "").trim(),
      director: String(formData.get("director") ?? "").trim(),
      writers: String(formData.get("writers") ?? "").trim(),
      cast: String(formData.get("cast") ?? "").trim(),
      imdbRating: String(formData.get("imdbRating") ?? "").trim(),
      imdbVotes: String(formData.get("imdbVotes") ?? "").trim(),
      metascore: String(formData.get("metascore") ?? "").trim(),
      awards: String(formData.get("awards") ?? "").trim(),
      originalLanguage: String(formData.get("originalLanguage") ?? "").trim(),
      productionCountries: countriesRaw
        ? countriesRaw.split(",").map((item) => item.trim()).filter(Boolean)
        : movie.metadata.productionCountries,
    },
  });

  revalidatePath(`/movies/${slug}`);
  revalidatePath("/moderation");
  redirect(`/movies/${slug}`);
}

export async function resyncMovieFromImdb(formData: FormData) {
  await requireModerator();
  const slug = String(formData.get("slug") ?? "").trim();
  const movie = await getCatalogMovieBySlug(slug);
  if (!movie) redirect("/#catalog");

  await clearMovieOverride(movie.id);
  revalidatePath(`/movies/${slug}`);
  revalidatePath("/moderation");
  redirect(`/movies/${slug}`);
}

export async function deleteMovie(formData: FormData) {
  const session = await requireModerator();
  if (session.role !== "owner") {
    redirect("/login");
  }
  const slug = String(formData.get("slug") ?? "").trim();
  const movie = await getCatalogMovieBySlug(slug);
  if (!movie) redirect("/#catalog");
  await deleteMovieById(movie.id);
  revalidatePath("/");
  revalidatePath(`/movies/${slug}`);
  revalidatePath("/moderation");
  redirect("/#catalog");
}

export async function updateSightingInfo(formData: FormData) {
  const moderator = await requireModerator();
  const slug = String(formData.get("slug") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || `/movies/${slug}`;
  const sightingId = String(formData.get("sightingId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const timestamp = String(formData.get("timestamp") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const spoiler = formData.get("spoiler") === "on";
  const approximateRatCount = clampApproximateRatCount(
    formData.get("approximateRatCount"),
  );
  const curatorNote = String(formData.get("curatorNote") ?? "").trim();
  const reason = "Edited from movie page.";
  const imageListManaged = String(formData.get("imageListManaged") ?? "") === "1";
  let nextImages: SightingImageSlot[] = [];
  if (imageListManaged) {
    const finalImageAlts = formData
      .getAll("finalImageAlt")
      .map((value) => String(value ?? "").trim());
    nextImages = formData
      .getAll("finalImageUrl")
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .map((url, index) => ({
        url,
        alt: finalImageAlts[index] || undefined,
      }))
      .slice(0, 5);
  } else {
    const existingImageUrls = formData
      .getAll("existingImageUrl")
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    const existingImageAlts = formData
      .getAll("existingImageAlt")
      .map((value) => String(value ?? "").trim());
    const removeExistingImageUrls = new Set(
      formData
        .getAll("removeExistingImageUrl")
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    );
    const keptExistingImages: SightingImageSlot[] = existingImageUrls
      .map((url, index) => ({
        url,
        alt: existingImageAlts[index] || undefined,
      }))
      .filter((slot) => !removeExistingImageUrls.has(slot.url));
    const uploadedImages = await persistSightingUploads(formData);
    nextImages = [...keptExistingImages, ...uploadedImages].slice(0, 5);
  }
  const leadImage = nextImages[0];

  if (!slug || !sightingId || !title || !timestamp || !description) {
    redirect(returnTo);
  }

  if (sightingId.startsWith("queue-")) {
    const submissionId = sightingId.slice("queue-".length);
    await reviewSubmission({
      submissionId,
      decision: "edited and approved",
      moderator,
      reason,
      edits: {
        title,
        timestamp,
        description,
        spoiler,
        approximateRatCount,
        curatorNote: curatorNote || undefined,
        images: nextImages,
        imageUrl: leadImage?.url,
        imageAlt: leadImage?.alt,
      },
    });
  } else {
    await updateSightingOverride(sightingId, {
      title,
      timestamp,
      description,
      spoiler,
      approximateRatCount,
      curatorNote: curatorNote || undefined,
      images: nextImages,
      imageUrl: leadImage?.url,
      imageAlt: leadImage?.alt,
    });
  }

  revalidatePath(returnTo.split("?")[0] || `/movies/${slug}`);
  revalidatePath("/moderation");
  redirect(returnTo);
}

export async function deleteSighting(formData: FormData) {
  await requireModerator();
  const slug = String(formData.get("slug") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || `/movies/${slug}`;
  const sightingId = String(formData.get("sightingId") ?? "").trim();
  if (!slug || !sightingId) {
    redirect(returnTo);
  }
  if (sightingId.startsWith("queue-")) {
    const submissionId = sightingId.slice("queue-".length);
    const moderator = await requireModerator();
    await reviewSubmission({
      submissionId,
      decision: "rejected",
      moderator,
      reason: "Removed from movie page.",
    });
  } else {
    await deleteSightingById(sightingId);
  }
  revalidatePath(returnTo.split("?")[0] || `/movies/${slug}`);
  revalidatePath("/moderation");
  redirect(returnTo);
}
