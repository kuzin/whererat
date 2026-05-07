"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ToastTone = "success" | "error" | "info";

const toastMessages: Record<string, { title: string; body: string; tone: ToastTone }> = {
  queued: {
    title: "Submission queued",
    body: "Thanks. The sighting is waiting for moderator review.",
    tone: "success",
  },
  approved: {
    title: "Submission approved",
    body: "The admin auto-approved this sighting and recorded the review.",
    tone: "success",
  },
  missing: {
    title: "Missing details",
    body: "Please fill in the required fields before submitting.",
    tone: "error",
  },
  "no-imdb": {
    title: "No IMDb match",
    body: "We couldn't find a matching movie. Try searching by title or IMDb ID.",
    tone: "error",
  },
  "profile-updated": {
    title: "Profile saved",
    body: "Your profile details were updated.",
    tone: "success",
  },
  "password-updated": {
    title: "Password updated",
    body: "Your password was changed successfully.",
    tone: "success",
  },
  "password-invalid": {
    title: "Password not changed",
    body: "Check your current password and confirmation.",
    tone: "error",
  },
  "logged-in": {
    title: "Logged in",
    body: "Welcome back to the rat control room.",
    tone: "success",
  },
  "logged-out": {
    title: "Logged out",
    body: "Your moderator session has ended.",
    tone: "info",
  },
  invalid: {
    title: "Login failed",
    body: "That username or password did not work.",
    tone: "error",
  },
  "moderation-saved": {
    title: "Edits saved",
    body: "The submission was updated and kept in the pending queue.",
    tone: "success",
  },
  "moderation-requeued": {
    title: "Returned to queue",
    body: "The submission has been moved back to the pending review queue.",
    tone: "info",
  },
  "movie-saved": {
    title: "Movie saved",
    body: "Movie info was updated successfully.",
    tone: "success",
  },
  "sighting-saved": {
    title: "Sighting saved",
    body: "The sighting has been updated.",
    tone: "success",
  },
  "resync-success": {
    title: "Resynced from IMDb",
    body: "Movie metadata was refreshed with the latest data from OMDb.",
    tone: "success",
  },
  "resync-complete": {
    title: "Sync complete",
    body: "Refreshed from IMDb.",   // overridden dynamically below
    tone: "success",
  },
  "resync-all-complete": {
    title: "Bulk sync complete",
    body: "Refreshed all movies from IMDb.", // overridden dynamically below
    tone: "success",
  },
  "resync-failed": {
    title: "Resync failed",
    body: "Could not reach OMDb. Check your API key or try again later.",
    tone: "error",
  },
  "resync-no-key": {
    title: "OMDb not configured",
    body: "Set OMDB_API_KEY to enable live metadata syncing.",
    tone: "info",
  },
  "moderation-approved": {
    title: "Sighting approved",
    body: "The submission has been approved and is now publicly visible.",
    tone: "success",
  },
  "moderation-rejected": {
    title: "Submission denied",
    body: "The submission has been rejected and moved to the history log.",
    tone: "info",
  },
  deleted: {
    title: "Deleted",
    body: "The item has been permanently removed.",
    tone: "error",
  },
  error: {
    title: "Something went wrong",
    body: "An unexpected error occurred. Please try again.",
    tone: "error",
  },
};

const toneBorder: Record<ToastTone, string> = {
  success: "border-green-700 dark:border-green-500",
  error: "border-red-700 dark:border-red-500",
  info: "border-amber-600 dark:border-amber-400",
};

const toneShadow: Record<ToastTone, string> = {
  success: "[box-shadow:4px_4px_0_0_rgb(21_128_61/0.7)] dark:[box-shadow:4px_4px_0_0_rgb(22_101_52/0.8)]",
  error: "[box-shadow:4px_4px_0_0_rgb(185_28_28/0.7)] dark:[box-shadow:4px_4px_0_0_rgb(153_27_27/0.8)]",
  info: "[box-shadow:4px_4px_0_0_rgb(180_83_9/0.7)] dark:[box-shadow:4px_4px_0_0_rgb(146_64_14/0.8)]",
};

export function ToastNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const toastKey = searchParams.get("toast") ?? searchParams.get("status") ?? searchParams.get("error");
  const toast = useMemo(() => {
    if (!toastKey) return undefined;
    const base = toastMessages[toastKey];
    if (!base) return undefined;

    if (toastKey === "resync-all-complete") {
      const synced = Number(searchParams.get("synced") ?? 0);
      const errors = Number(searchParams.get("errors") ?? 0);
      const lines: string[] = [];
      lines.push(`${synced} ${synced === 1 ? "movie" : "movies"} synced from IMDb`);
      if (errors > 0) {
        lines.push(`${errors} ${errors === 1 ? "movie" : "movies"} failed — check server logs`);
      }
      return { ...base, body: lines.join("\n") };
    }

    if (toastKey === "resync-complete") {
      const lines: string[] = [];

      // Metadata
      if (searchParams.get("meta") === "1") lines.push("Metadata updated from OMDb");

      // Rat facts / trivia
      const facts = searchParams.get("facts");
      const triviaStatus = searchParams.get("trivia");
      if (facts !== null) {
        const n = Number(facts);
        lines.push(n > 0 ? `${n} rat ${n === 1 ? "fact" : "facts"} from IMDb trivia` : "No rat trivia entries found");
      } else if (triviaStatus === "error") {
        lines.push("Trivia unavailable (IMDb API error)");
      }

      // Reviews
      const reviews = searchParams.get("reviews");
      if (reviews !== null) {
        const r = Number(reviews);
        if (r > 0) {
          const rr = Number(searchParams.get("ratreviews") ?? 0);
          lines.push(
            `${r} ${r === 1 ? "review" : "reviews"} pulled` +
            (rr > 0 ? ` · ${rr} mention rats 🐀` : "")
          );
        } else {
          lines.push("No reviews found on IMDb");
        }
      }

      // Related titles
      const related = searchParams.get("related");
      if (related !== null) {
        const n = Number(related);
        lines.push(n > 0 ? `${n} related title${n === 1 ? "" : "s"} (Ratlated)` : "No related titles found");
      }

      // Media
      const videos = searchParams.get("videos");
      const images = searchParams.get("images");
      if (videos !== null || images !== null) {
        const v = Number(videos ?? 0);
        const im = Number(images ?? 0);
        if (v > 0 || im > 0) {
          const parts: string[] = [];
          if (v > 0) parts.push(`${v} ${v === 1 ? "video" : "videos"}`);
          if (im > 0) parts.push(`${im} ${im === 1 ? "photo" : "photos"}`);
          lines.push(`Media: ${parts.join(", ")}`);
        } else {
          lines.push("No media found on IMDb");
        }
      }

      return { ...base, body: lines.join("\n") };
    }

    return base;
  }, [toastKey, searchParams]);

  useEffect(() => {
    if (!toast) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("toast");
      next.delete("status");
      next.delete("error");
      next.delete("facts");
      next.delete("trivia");
      next.delete("meta");
      next.delete("reviews");
      next.delete("ratreviews");
      next.delete("related");
      next.delete("videos");
      next.delete("images");
      next.delete("synced");
      next.delete("errors");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [toast, pathname, router, searchParams]);

  if (!toast || !isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),5rem)] z-[9999] flex justify-end px-4 sm:px-6">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto w-full max-w-sm rounded-xl border-2 bg-white p-5 dark:bg-stone-900 ${toneBorder[toast.tone]} ${toneShadow[toast.tone]}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="wr-display text-lg font-bold text-stone-900 dark:text-stone-50">{toast.title}</p>
            {toast.body.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{line}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              const next = new URLSearchParams(searchParams.toString());
              next.delete("toast");
              next.delete("status");
              next.delete("error");
              next.delete("facts");
              next.delete("trivia");
              next.delete("meta");
              next.delete("reviews");
              next.delete("ratreviews");
              next.delete("related");
              next.delete("videos");
              next.delete("images");
              next.delete("synced");
              next.delete("errors");
              const query = next.toString();
              router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
              });
            }}
            className="mt-0.5 shrink-0 text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
            aria-label="Dismiss notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
