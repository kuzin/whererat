"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import {
  updateStoredModeratorPassword,
  updateStoredModeratorProfile,
} from "@/lib/user-store";

async function getSessionOrRedirect() {
  const cookieStore = await cookies();
  const session = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/login?next=/profile");
  }

  return { cookieStore, session };
}

const AVATAR_IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_AVATAR_UPLOAD_BYTES = 8 * 1024 * 1024;

async function persistAvatarUpload(formData: FormData) {
  const raw = formData.get("avatarImage");
  if (!(raw instanceof File) || raw.size === 0) {
    return undefined;
  }

  const ext = AVATAR_IMAGE_MIME_EXT[raw.type];
  if (!ext || raw.size > MAX_AVATAR_UPLOAD_BYTES) {
    return undefined;
  }

  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const fileName = `${crypto.randomUUID()}${ext}`;
  const bytes = Buffer.from(await raw.arrayBuffer());
  await writeFile(path.join(dir, fileName), bytes);
  return `/uploads/avatars/${fileName}`;
}

export async function updateProfile(formData: FormData) {
  const { cookieStore, session } = await getSessionOrRedirect();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const currentAvatarUrl = String(formData.get("currentAvatarUrl") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim().toLowerCase();
  const role = roleRaw === "owner" ? "owner" : "moderator";
  const uploadedAvatarUrl = await persistAvatarUpload(formData);
  const avatarUrl = uploadedAvatarUrl ?? currentAvatarUrl;

  if (!name || !email || !avatarUrl) {
    redirect("/profile?status=missing");
  }

  const result = await updateStoredModeratorProfile({
    userId: session.id,
    name,
    email,
    avatarUrl,
    role,
  });

  if (!result) {
    redirect("/profile?status=error");
  }

  cookieStore.set(MODERATOR_SESSION_COOKIE, result.sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  revalidatePath("/profile");
  redirect("/profile?status=profile-updated");
}

export async function updatePassword(formData: FormData) {
  const { session } = await getSessionOrRedirect();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !nextPassword || nextPassword !== confirmPassword) {
    redirect("/profile?status=password-invalid");
  }

  const updated = await updateStoredModeratorPassword({
    userId: session.id,
    currentPassword,
    nextPassword,
  });

  if (!updated) {
    redirect("/profile?status=password-invalid");
  }

  redirect("/profile?status=password-updated");
}
