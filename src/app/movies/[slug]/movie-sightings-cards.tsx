"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  estimateRatsForAppearance,
  formatApproximateRatLine,
  formatSightingStartingTimeDisplay,
  getSightingCardHeadline,
  getSightingImageRefs,
  type Sighting,
} from "@/lib/whererat";
import { SightingMarkdown } from "@/components/sighting-markdown";
import { SightingImageCarousel } from "./sighting-image-carousel";
import { SightingRatPresenceVisual } from "./rat-presence-visual";

function trimNote(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function MovieSightingsCards({
  items,
  palette,
  spoilerCountMovie,
  canEditSightings = false,
  editBasePath = "",
}: {
  items: Sighting[];
  palette: boolean;
  /** Total flagged spoilers on this title (show toggle when > 0). */
  spoilerCountMovie: number;
  canEditSightings?: boolean;
  editBasePath?: string;
}) {
  const [showSpoilers, setShowSpoilers] = useState(false);
  const spoilerToggleLabelId = useId();

  const showSpoilerToggle = spoilerCountMovie > 0;

  const panelSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_12%,rgb(41_37_36))] bg-[color-mix(in_srgb,var(--movie-column-wash)_48%,rgb(253_251_246))]"
    : "border-stone-950/90 bg-[var(--wr-surface-cream-soft)]";

  const spoilerRedactTitle =
    "select-none text-transparent [text-shadow:0_0_12px_rgb(120_113_108/0.75)] dark:[text-shadow:0_0_12px_rgb(168_162_158/0.6)]";

  const spoilerRedactDescWrapper =
    "select-none pointer-events-none [&_*]:text-transparent [&_*]:[text-shadow:0_0_9px_rgb(120_113_108/0.65)] dark:[&_*]:[text-shadow:0_0_9px_rgb(168_162_158/0.5)]";

  const toggleSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_22%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_40%,rgb(253_251_246))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(76_72_69))] dark:bg-[rgb(34_29_24)] dark:text-stone-100"
    : "border-stone-950/85 bg-[var(--wr-surface-cream-muted)]";

  return (
    <>
      {showSpoilerToggle ? (
        <div
          className={`my-6 flex flex-col gap-4 rounded-xl border-2 px-4 py-3.5 sm:px-5 md:flex-row md:items-center md:justify-between md:gap-5 md:py-4 ${toggleSkin}`}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <p className="wr-display text-lg font-bold leading-snug text-stone-950 sm:text-xl dark:text-stone-50">
              This title has spoilers.
            </p>
            <p className="text-sm leading-snug text-stone-700 dark:text-stone-300">
              <span className="tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                {spoilerCountMovie}
              </span>{" "}
              {spoilerCountMovie === 1
                ? "sighting hides its title, description, and images"
                : "sightings hide their titles, descriptions, and images"}{" "}
              until you turn on the switch.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-row items-center justify-between gap-3 border-t border-stone-800/10 pt-3.5 dark:border-white/10 sm:gap-4 md:w-auto md:justify-end md:border-t-0 md:border-l-2 md:border-stone-800/12 md:pt-0 md:pl-5 md:dark:border-white/12 lg:border-l-0 lg:pl-0 lg:gap-3">
            <span
              id={spoilerToggleLabelId}
              className="text-sm font-bold text-stone-800 dark:text-stone-200"
            >
              Show spoilers
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showSpoilers}
              aria-labelledby={spoilerToggleLabelId}
              onClick={() => setShowSpoilers((prev) => !prev)}
              className={`relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border-2 transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out active:scale-[0.94] motion-reduce:duration-150 motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                showSpoilers
                  ? "border-amber-700 bg-amber-500 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] dark:border-amber-500 dark:bg-amber-600"
                  : "border-stone-700/80 bg-[color-mix(in_srgb,rgb(120_113_108)_22%,rgb(255_253_248))] dark:border-white/25 dark:bg-stone-700"
              }`}
            >
              <span
                className={`pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow-md ring-1 ring-stone-900/10 will-change-transform motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.34,1.28,0.64,1)] motion-reduce:duration-150 dark:ring-white/10 ${
                  showSpoilers ? "translate-x-[1.35rem]" : "translate-x-0"
                }`}
              />
              <span className="sr-only">
                {showSpoilers
                  ? "Spoilers visible; press to hide."
                  : "Spoilers hidden; press to show."}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-6 md:space-y-8">
        {items.map((sighting) => {
          const imageSlides = getSightingImageRefs(sighting);
          const hasCarousel = imageSlides.length > 0;
          const curatorNote = trimNote(sighting.curatorNote);
          const blackoutSpoiler = sighting.spoiler && !showSpoilers;
          const headlineText = getSightingCardHeadline(sighting);
          const startingTimeLabel = formatSightingStartingTimeDisplay(sighting);
          const ratEstimate = estimateRatsForAppearance(sighting);
          const submitterCredit = trimNote(sighting.submitterName);
          const submittedByLine =
            submitterCredit ? (
              <p className="text-sm italic leading-relaxed text-stone-600/75 dark:text-stone-400/70">
                <span className="font-semibold">Submitted by </span>
                {submitterCredit}
              </p>
            ) : null;
          const editHref =
            canEditSightings && editBasePath
              ? `${editBasePath}${editBasePath.includes("?") ? "&" : "?"}editSighting=${encodeURIComponent(sighting.id)}`
              : undefined;

          const headerRight = (
            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2">
              <SightingRatPresenceVisual
                estimatedCount={ratEstimate}
                palette={palette}
              />
              <span
                className="inline-flex h-9 items-center rounded-lg border border-amber-900/25 bg-amber-50 px-3 text-xs font-semibold tabular-nums text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/45 dark:text-amber-100"
                title="Estimated rats on screen for this moment"
              >
                {formatApproximateRatLine(ratEstimate)}
              </span>
            </div>
          );

          return (
            <article
              key={sighting.id}
              className={`overflow-hidden rounded-2xl border-2 shadow-[3px_3px_0_0_rgb(28_25_23/0.55)] dark:border-white/14 dark:bg-[rgb(36_30_26)] dark:shadow-[3px_3px_0_0_rgb(0_0_0/0.4)] ${panelSkin}`}
            >
              {hasCarousel ? (
                <SightingImageCarousel
                  slides={imageSlides}
                  spoilerHidden={blackoutSpoiler}
                />
              ) : null}
              <div
                className={`p-5 sm:p-6 md:p-7 ${hasCarousel ? "" : "pt-6 sm:pt-7"}`}
              >
                <div className="flex flex-col gap-4">
                  {/* Content */}
                  <div className="flex flex-col gap-2 md:gap-2.5">
                    <h3
                      aria-hidden={blackoutSpoiler}
                      className={`wr-display w-full max-w-none text-2xl font-bold leading-snug md:text-3xl md:leading-[1.18] ${blackoutSpoiler ? spoilerRedactTitle : "text-stone-950 dark:text-stone-50"}`}
                    >
                      {headlineText}
                    </h3>
                    {blackoutSpoiler ? <span className="sr-only">Sighting title hidden: spoiler toggle is off.</span> : null}
                    <div
                      aria-hidden={blackoutSpoiler}
                      className={blackoutSpoiler ? spoilerRedactDescWrapper : undefined}
                    >
                      <SightingMarkdown
                        markdown={sighting.description}
                        className="w-full min-w-0 max-w-none text-stone-700 dark:text-stone-300"
                      />
                    </div>
                    {blackoutSpoiler ? <span className="sr-only">Description hidden: turn on spoiler display to read it.</span> : null}
                    {submittedByLine}
                  </div>
                  {curatorNote ? (
                    <div className="rounded-xl border border-stone-200/90 bg-stone-50 p-4 shadow-sm dark:border-amber-200/22 dark:bg-[rgb(26_22_18)] dark:shadow-none sm:p-5">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                        Curator note
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                        {curatorNote}
                      </p>
                    </div>
                  ) : null}
                  {/* Footer bar */}
                  <div className="flex w-full flex-wrap items-center gap-2 border-t border-stone-900/10 pt-3 dark:border-white/10">
                    <p
                      className="inline-flex h-9 items-center gap-x-1 rounded-lg border border-orange-800/25 bg-orange-50 px-3 text-sm tracking-tight text-orange-950 dark:border-orange-400/35 dark:bg-orange-950/50 dark:text-amber-100"
                      title="Position in film"
                      aria-label={`Sighting at ${startingTimeLabel} into the film`}
                    >
                      <span className="font-bold tabular-nums">{startingTimeLabel}</span>
                      <span className="font-medium opacity-70">into film</span>
                    </p>
                    {sighting.spoiler ? (
                      <span className="inline-flex h-9 items-center rounded-lg border border-red-800/30 bg-[#fecaca] px-3 text-xs font-semibold text-red-950 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
                        Spoiler
                      </span>
                    ) : null}
                    <div className="ml-auto flex items-center gap-2">
                      {headerRight}
                      {editHref ? (
                        <Link
                          href={editHref}
                          className="wr-btn-ghost inline-flex h-9 w-9 shrink-0 items-center justify-center px-0 text-lg"
                          aria-label="Edit sighting"
                          title="Edit sighting"
                        >
                          ✎
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
