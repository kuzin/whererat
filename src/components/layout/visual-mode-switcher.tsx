"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "whererat-theme-mode";
const ROOT_CLASS = "dark";

type ThemeMode = "light" | "dark";

function isDarkApplied() {
  return (
    document.documentElement.classList.contains(ROOT_CLASS) ||
    document.body.classList.contains(ROOT_CLASS)
  );
}

function applyTheme(mode: ThemeMode) {
  const isDark = mode === "dark";
  document.documentElement.classList.toggle(ROOT_CLASS, isDark);
  document.body.classList.toggle(ROOT_CLASS, isDark);
  document.documentElement.dataset.theme = mode;
  document.body.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  document.body.style.colorScheme = mode;
}

export function VisualModeSwitcher({
  label = "For Kaitlyn. ❤️",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const domIsDark = isDarkApplied();
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: ThemeMode =
        stored === "dark" || stored === "light"
          ? stored
          : domIsDark
            ? "dark"
          : systemPrefersDark
            ? "dark"
            : "light";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(initial);
    } catch {
      // Ignore storage issues in private/restricted contexts.
    }
  }, []);

  const toggle = useCallback(() => {
    const isDark = isDarkApplied();
    const next: ThemeMode = isDark ? "light" : "dark";
    applyTheme(next);
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage issues in private/restricted contexts.
    }
  }, []);

  const nextLabel = mode === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel} mode`}
      title={`Switch to ${nextLabel} mode`}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-950/25 bg-white/70 text-stone-700 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-white/25 dark:bg-stone-900/60 dark:text-amber-100 dark:hover:bg-stone-900/80 ${className}`}
      data-mode={mode}
    >
      {mode === "dark" ? (
        // Currently dark → show a sun (will switch to light)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Currently light → show a moon (will switch to dark)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
      <span className="sr-only">Switch to {nextLabel} mode — {label}</span>
    </button>
  );
}
