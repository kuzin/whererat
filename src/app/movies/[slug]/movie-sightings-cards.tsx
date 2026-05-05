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
    : "border-stone-950/90 bg-[#fffdf8]";

  const spoilerRedactTitle = palette
    ? "block w-full max-w-full select-none rounded-md border border-stone-900/18 bg-[color-mix(in_srgb,rgb(28_25_23)_30%,rgb(253_251_246))] px-0 py-1 text-transparent shadow-[inset_0_1px_2px_rgb(28_25_23/0.1)] dark:border-white/12 dark:bg-[color-mix(in_srgb,rgb(0_0_0)_40%,rgb(36_30_26))] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]"
    : "block w-full max-w-full select-none rounded-md border border-stone-900/14 bg-[color-mix(in_srgb,rgb(28_25_23)_18%,rgb(255_253_248))] px-0 py-1 text-transparent shadow-[inset_0_1px_2px_rgb(28_25_23/0.08)] dark:border-white/10 dark:bg-[color-mix(in_srgb,rgb(0_0_0)_36%,rgb(36_30_26))] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.28)]";

  const spoilerRedactDesc = palette
    ? "select-none rounded-md border border-stone-900/18 bg-[color-mix(in_srgb,rgb(28_25_23)_28%,rgb(253_251_246))] px-0 py-1.5 text-base leading-relaxed text-transparent shadow-[inset_0_1px_2px_rgb(28_25_23/0.1)] dark:border-white/12 dark:bg-[color-mix(in_srgb,rgb(0_0_0)_38%,rgb(36_30_26))] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]"
    : "select-none rounded-md border border-stone-900/14 bg-[color-mix(in_srgb,rgb(28_25_23)_16%,rgb(255_253_248))] px-0 py-1.5 text-base leading-relaxed text-transparent shadow-[inset_0_1px_2px_rgb(28_25_23/0.08)] dark:border-white/10 dark:bg-[color-mix(in_srgb,rgb(0_0_0)_34%,rgb(36_30_26))] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.28)]";

  const toggleSkin = palette
    ? "border-[color-mix(in_srgb,var(--movie-accent)_22%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_40%,rgb(253_251_246))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(76_72_69))] dark:bg-[rgb(34_29_24)] dark:text-stone-100"
    : "border-stone-950/85 bg-[#fffbf5]";

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
                ? "sighting hides its title and description"
                : "sightings hide their titles and descriptions"}{" "}
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
            <div
              className={
                blackoutSpoiler
                  ? "flex max-w-[min(100%,22rem)] flex-row flex-wrap items-center justify-end gap-2 md:max-w-none"
                  : "ml-auto flex max-w-full shrink-0 flex-row flex-wrap items-center justify-end gap-2"
              }
            >
              <SightingRatPresenceVisual
                estimatedCount={ratEstimate}
                palette={palette}
              />
              {sighting.spoiler ? (
                <span className="rounded-md border border-red-800/30 bg-[#fecaca] px-2.5 py-0.5 text-xs font-semibold text-red-950 dark:border-red-400/35 dark:bg-red-950/50 dark:text-red-100">
                  Spoiler
                </span>
              ) : null}
              <span
                className="rounded-md border border-amber-900/25 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/45 dark:text-amber-100"
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
                <SightingImageCarousel slides={imageSlides} />
              ) : null}
              <div
                className={`p-5 sm:p-6 md:p-7 ${hasCarousel ? "" : "pt-6 sm:pt-7"}`}
              >
                {blackoutSpoiler ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <p
                        className="inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5 rounded-md border border-orange-800/25 bg-orange-50 px-2.5 py-1 text-sm font-semibold tracking-tight text-orange-950 dark:border-orange-400/35 dark:bg-orange-950/50 dark:text-amber-100"
                        title="Rat sighting starting time"
                        aria-label={`Rat sighting; starting time ${startingTimeLabel}`}
                      >
                        <span className="font-bold">Rat sighting</span>
                        <span className="font-semibold opacity-85" aria-hidden={true}>
                          ·
                        </span>
                        <span className="tabular-nums font-semibold">
                          {startingTimeLabel}
                        </span>
                      </p>
                      {headerRight}
                    </div>
                    <div className="flex flex-col gap-3">
                      <h3
                        aria-hidden={true}
                        className={`wr-display w-full max-w-none text-2xl font-bold leading-snug md:text-3xl md:leading-[1.18] ${spoilerRedactTitle}`}
                      >
                        {headlineText}
                      </h3>
                      <span className="sr-only">
                        Sighting title hidden: spoiler toggle is off.
                      </span>
                      <p
                        aria-hidden={true}
                        className={`text-base leading-relaxed ${spoilerRedactDesc}`}
                      >
                        {sighting.description}
                      </p>
                      <p className="sr-only">
                        Description hidden: turn on spoiler display to read it.
                      </p>
                      {submittedByLine}
                      {editHref ? (
                        <div className="mt-2">
                          <Link
                            href={editHref}
                            className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 underline decoration-amber-700/40 underline-offset-2 hover:decoration-amber-800 dark:text-amber-300 dark:decoration-amber-300/40 dark:hover:decoration-amber-300"
                          >
                            Edit sighting
                          </Link>
                        </div>
                      ) : null}
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
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 md:gap-7">
                    <div className="flex flex-col gap-2 md:gap-2.5">
                      <div className="flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-3">
                        <p
                          className="inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5 rounded-md border border-orange-800/25 bg-orange-50 px-2.5 py-1 text-sm font-semibold tracking-tight text-orange-950 dark:border-orange-400/35 dark:bg-orange-950/50 dark:text-amber-100"
                          title="Rat sighting starting time"
                          aria-label={`Rat sighting; starting time ${startingTimeLabel}`}
                        >
                          <span className="font-bold">Rat sighting</span>
                          <span className="font-semibold opacity-85" aria-hidden={true}>
                            ·
                          </span>
                          <span className="tabular-nums font-semibold">
                            {startingTimeLabel}
                          </span>
                        </p>
                        {headerRight}
                      </div>
                      <h3 className="wr-display w-full max-w-none text-2xl font-bold leading-snug text-stone-950 md:text-3xl md:leading-[1.18] dark:text-stone-50">
                        {headlineText}
                      </h3>
                      <p className="w-full min-w-0 max-w-none text-base leading-relaxed text-stone-700 dark:text-stone-300">
                        {sighting.description}
                      </p>
                      {submittedByLine}
                      {editHref ? (
                        <div className="mt-2">
                          <Link
                            href={editHref}
                            className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800 underline decoration-amber-700/40 underline-offset-2 hover:decoration-amber-800 dark:text-amber-300 dark:decoration-amber-300/40 dark:hover:decoration-amber-300"
                          >
                            Edit sighting
                          </Link>
                        </div>
                      ) : null}
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
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
