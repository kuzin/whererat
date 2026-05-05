"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "whererat-theme";
const THEME_CHANGE_EVENT = "whererat-themechange";

function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

function isDarkModeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

/** Dev-only light / dark toggle; preference in localStorage under `whererat-theme`. */
export function ThemeDevToggle({ className = "" }: { className?: string }) {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    isDarkModeSnapshot,
    () => false,
  );

  const toggle = useCallback(() => {
    const nowDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(STORAGE_KEY, nowDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark") {
        document.documentElement.classList.add("dark");
      } else if (stored === "light") {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // ignore localStorage read issues in restricted environments
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title="Dev: toggle light / dark theme"
      aria-pressed={isDark}
      suppressHydrationWarning
      className={`cursor-pointer rounded-md border-2 border-stone-950/80 bg-white/95 px-2 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-stone-800 shadow-[2px_2px_0_0_rgb(28_25_23/0.55)] backdrop-blur-sm transition hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/25 dark:bg-stone-900/95 dark:text-amber-100 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.55)] ${className}`}
    >
      {isDark ? "dark" : "light"}
    </button>
  );
}
