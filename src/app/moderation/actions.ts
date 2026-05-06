"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { deleteSubmissionById, reviewSubmission } from "@/lib/moderation-store";
import {
  clampApproximateRatCount,
  normalizeSightingTimestampInput,
  type SightingImageSlot,
} from "@/lib/whererat";
import { persistSightingFiles } from "@/lib/media-storage";

const MAX_SIGHTING_UPLOAD_BYTES = 8 * 1024 * 1024;

async function getModeratorOrRedirect() {
  const cookieStore = await cookies();
  const session = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/login?next=/moderation");
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

export async function moderateSubmission(formData: FormData) {
  const moderator = await getModeratorOrRedirect();
  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "") as
    | "approved"
    | "edited"
    | "edited and approved"
    | "rejected";
  const reason = String(formData.get("reason") ?? "").trim();
  const curatorNote = String(formData.get("curatorNote") ?? "").trim();
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

  if (!submissionId || !decision) {
    return;
  }

  const hasEditFields =
    formData.has("sightingTitle") ||
    formData.has("timestamp") ||
    formData.has("description") ||
    formData.has("approximateRatCount") ||
    formData.has("imageListManaged") ||
    formData.has("existingImageUrl") ||
    formData.has("sightingImages");
  const edits = hasEditFields
    ? {
        title: String(formData.get("sightingTitle") ?? "").trim(),
        timestamp: normalizeSightingTimestampInput(
          String(formData.get("timestamp") ?? ""),
        ),
        description: String(formData.get("description") ?? "").trim(),
        spoiler: formData.get("spoiler") === "on",
        approximateRatCount: clampApproximateRatCount(
          formData.get("approximateRatCount"),
        ),
        images: nextImages,
        imageUrl: leadImage?.url,
        imageAlt: leadImage?.alt,
        curatorNote: curatorNote || undefined,
      }
    : curatorNote
      ? { curatorNote }
      : undefined;

  if (decision === "edited and approved") {
    await reviewSubmission({
      submissionId,
      decision,
      moderator,
      reason: reason || "Edited by moderator before approval.",
      edits,
    });
    revalidatePath("/moderation");
    return;
  }

  if (decision === "edited") {
    await reviewSubmission({
      submissionId,
      decision,
      moderator,
      reason: reason || "Saved edits in moderation modal.",
      edits,
    });
    revalidatePath("/moderation");
    redirect("/moderation?toast=moderation-saved");
  }

  await reviewSubmission({
    submissionId,
    decision,
    moderator,
    reason:
      decision === "rejected"
        ? reason || "Rejected from moderation queue."
        : reason,
    edits,
  });
  revalidatePath("/moderation");
}

export async function removeSubmission(formData: FormData) {
  await getModeratorOrRedirect();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/moderation";
  if (!submissionId) {
    redirect(returnTo);
  }
  await deleteSubmissionById(submissionId);
  revalidatePath("/moderation");
  redirect(returnTo);
}

export async function rereviewSubmission(formData: FormData) {
  const moderator = await getModeratorOrRedirect();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/moderation";
  if (!submissionId) {
    redirect(returnTo);
  }
  await reviewSubmission({
    submissionId,
    decision: "edited",
    moderator,
    reason: "Returned to pending queue for re-review.",
  });
  revalidatePath("/moderation");
  redirect(returnTo);
}
