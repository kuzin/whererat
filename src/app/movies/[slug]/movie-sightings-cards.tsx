"use client";

import Link from "next/link";
import { useId, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
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

/** Strip markdown-ish syntax for length / wrap simulation only. */
function spoilerPlainBodyForMeasure(markdown: string): string {
  return (
    markdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]+`/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_~|`-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

const MAX_HEADLINE_PLACEHOLDER_LINES = 14;
const MAX_BODY_PLACEHOLDER_LINES = 28;

function capLineWidths(widths: number[], maxLines: number, maxWidth: number): number[] {
  const capped = widths.slice(0, maxLines);
  return capped.map((w) => Math.min(Math.max(16, w), maxWidth));
}

/** Word-wrap to match how text would break for a given max width and canvas font. */
function canvasWrapLineWidths(text: string, font: string, maxWidthPx: number): number[] {
  if (typeof document === "undefined" || maxWidthPx < 8) return [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.font = font;

  const widths: number[] = [];

  const pushLine = (line: string) => {
    const t = line.trim();
    if (t.length > 0) widths.push(ctx.measureText(t).width);
  };

  const breakLongToken = (token: string): string[] => {
    const parts: string[] = [];
    let chunk = "";
    for (const ch of token) {
      const next = chunk + ch;
      if (ctx.measureText(next).width <= maxWidthPx) {
        chunk = next;
      } else {
        if (chunk) parts.push(chunk);
        chunk = ch;
      }
    }
    if (chunk) parts.push(chunk);
    return parts;
  };

  const words = text.split(/\s+/).filter(Boolean);
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidthPx) {
      line = candidate;
      continue;
    }
    if (line) pushLine(line);
    line = "";
    if (ctx.measureText(word).width <= maxWidthPx) {
      line = word;
    } else {
      const pieces = breakLongToken(word);
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i]!;
        if (i < pieces.length - 1) pushLine(p);
        else line = p;
      }
    }
  }
  if (line) pushLine(line);
  return widths;
}

const bodyLineClass =
  "h-[0.55em] min-h-[11px] max-h-[17px] shrink-0 rounded-full bg-[color-mix(in_srgb,rgb(147_143_139)_52%,transparent)] dark:bg-[color-mix(in_srgb,rgb(168_162_158)_48%,rgb(53_46_41))]";
const headlineRowClass =
  "h-[0.76em] min-h-[1.0625rem] max-h-[1.5rem] shrink-0 rounded-full bg-[color-mix(in_srgb,rgb(147_143_139)_56%,transparent)] dark:bg-[color-mix(in_srgb,rgb(166_159_154)_52%,rgb(48_41_37))]";

/** Solid pill bars sized to approximate real headline + description line lengths. */
function SpoilerPlaceholderCopy({
  headline,
  descriptionMarkdown,
}: {
  headline: string;
  descriptionMarkdown: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headFontProbeRef = useRef<HTMLSpanElement>(null);
  const bodyFontProbeRef = useRef<HTMLSpanElement>(null);
  const [lineWidths, setLineWidths] = useState<{
    headline: number[];
    body: number[];
  } | null>(null);

  const plainBody = useMemo(
    () => spoilerPlainBodyForMeasure(descriptionMarkdown),
    [descriptionMarkdown],
  );

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const headProbe = headFontProbeRef.current;
    const bodyProbe = bodyFontProbeRef.current;
    if (!wrap || !headProbe || !bodyProbe) return;
    const cw = wrap.clientWidth;
    if (cw < 8) return;
    const headFont = getComputedStyle(headProbe).font;
    const bodyFont = getComputedStyle(bodyProbe).font;
    const headText = headline.trim() || "—";
    const h = capLineWidths(
      canvasWrapLineWidths(headText, headFont, cw),
      MAX_HEADLINE_PLACEHOLDER_LINES,
      cw,
    );
    const bPlain = plainBody.trim();
    const b = bPlain
      ? capLineWidths(canvasWrapLineWidths(bPlain, bodyFont, cw), MAX_BODY_PLACEHOLDER_LINES, cw)
      : [];
    setLineWidths({ headline: h.length > 0 ? h : [Math.min(cw, 120)], body: b });
  }, [headline, plainBody]);

  useLayoutEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  const fallbackHeadCh = Math.min(46, Math.max(8, Math.round(headline.trim().length * 0.58)));
  const fallbackBodyCh = Math.min(58, Math.max(18, Math.round(plainBody.trim().length * 0.42)));

  const headW = lineWidths?.headline;
  const bodyW = lineWidths?.body;

  return (
    <div ref={wrapRef} className="relative w-full min-w-0 select-none" aria-hidden>
      <span
        ref={headFontProbeRef}
        className="wr-display pointer-events-none absolute top-0 left-0 -z-10 text-2xl font-bold leading-snug opacity-0 md:text-3xl md:leading-[1.18]"
        aria-hidden
      >
        Hg
      </span>
      <span
        ref={bodyFontProbeRef}
        className="pointer-events-none absolute top-0 left-0 -z-10 text-base leading-relaxed text-stone-700 opacity-0 dark:text-stone-300"
        aria-hidden
      >
        Hg
      </span>

      <div className="w-full space-y-[0.5em]">
        <div className="flex w-full min-w-0 flex-col gap-[0.35em]">
          {(headW ?? [null]).map((w, i) => (
            <div
              key={`h-${i}`}
              className={headlineRowClass}
              style={
                w != null
                  ? { width: `${Math.round(w)}px`, maxWidth: "100%" }
                  : { width: `${fallbackHeadCh}ch`, maxWidth: "100%" }
              }
            />
          ))}
        </div>

        {plainBody.trim().length > 0 ? (
          <div className="flex w-full min-w-0 flex-col gap-1.5 pt-0.5">
            {(bodyW ?? [null, null, null]).map((w, i) => (
              <div
                key={`b-${i}`}
                className={bodyLineClass}
                style={
                  w != null
                    ? { width: `${Math.round(w)}px`, maxWidth: "100%" }
                    : {
                        width:
                          i === 2
                            ? `min(100%, ${Math.max(14, Math.round(fallbackBodyCh * 0.62))}ch)`
                            : `min(100%, ${fallbackBodyCh}ch)`,
                        maxWidth: "100%",
                      }
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
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
                    {blackoutSpoiler ? (
                      <>
                        <div
                          role="heading"
                          aria-level={3}
                          className="wr-display w-full max-w-none text-2xl leading-snug md:text-3xl md:leading-[1.18]"
                          aria-label="Sighting title hidden until spoilers are shown"
                        >
                          <SpoilerPlaceholderCopy
                            headline={headlineText}
                            descriptionMarkdown={sighting.description}
                          />
                        </div>
                        <span className="sr-only">
                          Sighting title and description hidden: turn on “Show spoilers”
                          above to read them.
                        </span>
                      </>
                    ) : (
                      <>
                        <h3 className="wr-display w-full max-w-none text-2xl font-bold leading-snug text-stone-950 md:text-3xl md:leading-[1.18] dark:text-stone-50">
                          {headlineText}
                        </h3>
                        <SightingMarkdown
                          markdown={sighting.description}
                          className="w-full min-w-0 max-w-none text-stone-700 dark:text-stone-300"
                        />
                      </>
                    )}
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
