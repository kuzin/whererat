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

export function CaitlinEasterEggToggle({
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      className={`rounded-md border border-stone-950/25 bg-white/70 px-2 py-1 text-xs font-bold text-stone-700 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-white/25 dark:bg-stone-900/60 dark:text-amber-100 dark:hover:bg-stone-900/80 ${className}`}
      data-mode={mode}
    >
      {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
      <span className="sr-only"> — {label}</span>
    </button>
  );
}
