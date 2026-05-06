/**
 * Shared card-style helpers so every tab panel looks identical per-movie.
 *
 * Standard card  — neutral info block (text content)
 * Highlight card — rat-mention or featured content
 * Media card     — poster / video thumbnail (overflow-hidden, no padding)
 */

// ── Border + background colour tokens (no structural classes) ────────────────

export function tabCardColors(palette: boolean): string {
  return palette
    ? [
        "border-[color-mix(in_srgb,var(--movie-accent)_12%,rgb(41_37_36))]",
        "bg-[color-mix(in_srgb,var(--movie-column-wash)_48%,rgb(253_251_246))]",
        "dark:border-white/14",
        "dark:bg-[rgb(34_29_25/0.55)]",
      ].join(" ")
    : "border-stone-950/90 bg-[var(--wr-surface-cream-soft)] dark:border-white/14 dark:bg-[rgb(36_30_26)]";
}

// ── Composite helpers ────────────────────────────────────────────────────────

/** Text content card: same colours + standard padding. */
export function tabCardClass(palette: boolean): string {
  return `rounded-2xl border-2 px-5 py-4 shadow-[3px_3px_0_0_rgb(28_25_23/0.55)] dark:shadow-[3px_3px_0_0_rgb(0_0_0/0.4)] ${tabCardColors(palette)}`;
}

/** Highlighted card (rat-mentions, featured items). */
export function tabHighlightCardClass(palette: boolean): string {
  return palette
    ? [
        "rounded-xl border-2 px-5 py-4",
        "border-[color-mix(in_srgb,var(--movie-accent)_55%,rgb(180_100_40))]",
        "bg-[color-mix(in_srgb,var(--movie-column-wash)_50%,rgb(255_248_230))]",
        "dark:border-[color-mix(in_srgb,var(--movie-accent)_45%,rgb(120_80_20/0.7))]",
        "dark:bg-[rgb(40_28_14/0.75)]",
      ].join(" ")
    : "rounded-xl border-2 px-5 py-4 border-amber-400/70 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30";
}

/** Media card: same colours, overflow-hidden, no outer padding (image fills it). */
export function tabMediaCardClass(palette: boolean): string {
  return `rounded-2xl border-2 overflow-hidden shadow-[3px_3px_0_0_rgb(28_25_23/0.55)] dark:shadow-[3px_3px_0_0_rgb(0_0_0/0.4)] ${tabCardColors(palette)}`;
}

/** Shared section header border for all tab panels. */
export function tabHeaderBorderClass(palette: boolean): string {
  return palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(120_113_108/0.75))] dark:border-[color-mix(in_srgb,var(--movie-accent)_30%,rgb(245_240_232/0.24))]"
    : "border-stone-900/22 dark:border-white/18";
}
