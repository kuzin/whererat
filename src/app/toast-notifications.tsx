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
};

function toastClass(tone: ToastTone) {
  const base =
    "rounded-xl border-2 border-stone-950/85 shadow-lg shadow-stone-950/18 dark:border-white/15 dark:shadow-black/45 backdrop-blur-sm";

  if (tone === "error") {
    return `${base} bg-[#fecaca] text-red-950 dark:bg-red-950/45 dark:text-red-50 dark:ring-1 dark:ring-red-800/50`;
  }

  if (tone === "info") {
    return `${base} bg-[#92400e] text-[#fef3c7] dark:bg-amber-950/80 dark:text-amber-100`;
  }

  return `${base} bg-[#fef3c7] text-stone-900 dark:bg-amber-950/40 dark:text-stone-50`;
}

export function ToastNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const toastKey = searchParams.get("toast") ?? searchParams.get("status") ?? searchParams.get("error");
  const toast = useMemo(
    () => (toastKey ? toastMessages[toastKey] : undefined),
    [toastKey],
  );

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
        className={`pointer-events-auto w-full max-w-sm p-5 ${toastClass(toast.tone)}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="wr-display font-bold">{toast.title}</p>
            <p className="mt-1 text-sm leading-relaxed opacity-85">{toast.body}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              const next = new URLSearchParams(searchParams.toString());
              next.delete("toast");
              next.delete("status");
              next.delete("error");
              const query = next.toString();
              router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
              });
            }}
            className="rounded-full px-2 text-lg font-black opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
