"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createModeratorSession,
  MODERATOR_SESSION_COOKIE,
} from "@/lib/auth";
import { authenticateStoredModerator } from "@/lib/user-store";

function safeNextPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "/moderation");

  return next.startsWith("/") && !next.startsWith("//") ? next : "/moderation";
}

function withToast(path: string, toast: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}toast=${toast}`;
}

export async function loginModerator(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  const account = await authenticateStoredModerator(username, password);

  if (!account) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(MODERATOR_SESSION_COOKIE, createModeratorSession(account), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(withToast(next, "logged-in"));
}

export async function logoutModerator() {
  const cookieStore = await cookies();
  cookieStore.delete(MODERATOR_SESSION_COOKIE);

  redirect("/login?toast=logged-out");
}
