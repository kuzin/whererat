"use client";

import { Children, useState, type ReactNode } from "react";

type Tab = { id: string; label: string };

export function MovieTabsShell({
  tabs,
  palette,
  sidebarContent,
  children,
}: {
  tabs: Tab[];
  palette: boolean;
  sidebarContent: ReactNode;
  children: ReactNode | ReactNode[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const panels = Children.toArray(children);

  // ── Colour tokens ────────────────────────────────────────────────────────
  // Active bg must exactly match the panel background so the tab "sits on" it.
  // Palette light  → var(--movie-wash) = gradient 0% stop of .movie-page-palette-bg
  // Palette dark   → rgb(17 14 12)     = gradient 0% stop of .dark .movie-page-palette-bg
  // No-palette l/d → #fffbeb / #2d241d = wr-cheese-tile-cream base colours
  const activeBg = palette
    ? "bg-[var(--movie-wash,#fffbeb)] dark:bg-[rgb(17_14_12)]"
    : "bg-amber-50 dark:bg-[#2d241d]";

  const activeText = "text-stone-900 dark:text-stone-50";

  // Active border: visible on top/left/right; bottom colour matches bg → invisible seam.
  const activeBorder = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_55%,rgb(28_25_23/0.85))] dark:border-white/18"
    : "border-stone-950/85 dark:border-white/18";
  const activeBottomBorder = palette
    ? "[border-bottom-color:var(--movie-wash,#fffbeb)] dark:[border-bottom-color:rgb(17_14_12)]"
    : "[border-bottom-color:#fffbeb] dark:[border-bottom-color:#2d241d]";

  // Inactive: warm mid-tone — dark enough to recede against the hero, light
  // enough to read comfortably. Mixes the accent in at ~35% over a mid-dark base.
  const inactiveBg = palette
    ? "bg-[color-mix(in_srgb,var(--movie-accent)_35%,rgb(45_32_20))]"
    : "bg-stone-700/80";
  const inactiveText = palette
    ? "text-[color-mix(in_srgb,var(--movie-accent)_45%,rgb(230_215_198))]"
    : "text-stone-200";

  // Hover: visibly lighter + brighter text — feels responsive without being jarring.
  const inactiveHoverBg = palette
    ? "hover:bg-[color-mix(in_srgb,var(--movie-accent)_45%,rgb(62_44_26))]"
    : "hover:bg-stone-600/90";
  const inactiveHoverText = palette
    ? "hover:text-[color-mix(in_srgb,var(--movie-accent)_30%,rgb(255_248_238))]"
    : "hover:text-white";

  // Active-press: a touch darker so the click registers visually.
  const inactiveActiveBg = palette
    ? "active:bg-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(30_20_12))]"
    : "active:bg-stone-800";

  // Mobile select colours — mirrors the inactive tab palette so it feels
  // like a sibling of the tab bar rather than a foreign form element.
  const selectBg = palette
    ? "bg-[color-mix(in_srgb,var(--movie-accent)_35%,rgb(45_32_20))]"
    : "bg-stone-700/80";
  const selectText = palette
    ? "text-[color-mix(in_srgb,var(--movie-accent)_45%,rgb(230_215_198))]"
    : "text-stone-200";
  const selectBorder = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_55%,rgb(28_25_23/0.85))]"
    : "border-stone-950/85";

  return (
    <>
      {/* ── Folder tab bar — desktop only (sm:flex) ─────────────────────────
       *  -mt-[52px] + h-[52px]: tab bar renders entirely inside the hero,
       *  with the tab bottoms flush against the hero's border-b-2.
       *  The active tab's invisible bottom border covers that 2px seam.
       * ──────────────────────────────────────────────────────────────────*/}
      <div className="relative z-10 -mt-[52px] hidden items-end justify-center px-6 sm:flex lg:justify-end lg:px-10">
        <div className="flex items-end gap-2" role="tablist">
          {tabs.map((tab, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIdx(i)}
                className={[
                  "h-[52px] cursor-pointer rounded-t-xl px-6 text-base font-extrabold tracking-tight",
                  // Only animate color/shadow — never geometry — so there's no size flash or movement
                  "transition-[background-color,color,box-shadow,border-color] duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-1",
                  // Both states keep border-2 so the box size never changes on switch
                  "border-2",
                  isActive
                    ? [
                        activeBorder,
                        activeBottomBorder,
                        activeBg,
                        activeText,
                        "shadow-[0_-4px_14px_-2px_rgb(0_0_0/0.22)]",
                      ].join(" ")
                    : [
                        // Transparent border — same box size as active, invisible edge
                        "border-transparent",
                        "-translate-y-px",
                        inactiveBg,
                        inactiveText,
                        inactiveHoverBg,
                        inactiveHoverText,
                        inactiveActiveBg,
                      ].join(" "),
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile tab selector — hidden on sm+ ─────────────────────────
       *  Sits just below the hero border (no negative margin) so it never
       *  overlaps the poster/hero image on small screens.               */}
      <div className={`sm:hidden px-4 py-3 ${selectBg}`}>
        <div className="relative">
          <select
            value={activeIdx}
            onChange={(e) => setActiveIdx(Number(e.target.value))}
            aria-label="Select tab"
            className={[
              "w-full h-10 rounded-lg border-2 pl-3 pr-10 font-bold text-sm",
              "appearance-none cursor-pointer",
              "transition-[background-color,color,border-color] duration-150",
              "focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:ring-offset-1",
              selectBg,
              selectText,
              selectBorder,
            ].join(" ")}
          >
            {tabs.map((tab, i) => (
              <option key={tab.id} value={i}>
                {tab.label}
              </option>
            ))}
          </select>
          {/* Custom chevron — pointer-events-none so clicks pass through to the select */}
          <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${selectText}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 opacity-70">
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Two-column content grid ─────────────────────────────────────
       *  Explicit background pinned to the same value as the active tab so
       *  the seam between tab button and content is guaranteed flush.      */}
      <div className={`grid gap-10 p-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-10 lg:p-10 ${activeBg}`}>
        <aside
          className={`order-2 flex min-w-0 flex-col gap-8 lg:order-none lg:border-r lg:pr-11 lg:pt-0.5 ${
            palette
              ? "lg:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(120_113_108/0.85))] dark:lg:border-[color-mix(in_srgb,var(--movie-accent)_32%,rgb(245_240_232/0.28))]"
              : "lg:border-stone-900/22 dark:lg:border-white/18"
          }`}
        >
          {sidebarContent}
        </aside>

        <div className="order-1 min-w-0 lg:order-none">
          {panels.map((panel, i) => (
            <div key={i} hidden={i !== activeIdx} role="tabpanel">
              {panel}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
