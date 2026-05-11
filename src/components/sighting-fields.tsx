"use client";

/**
 * Shared rich field components used by both the public Submit form and the
 * moderator Edit Sighting modal. Any visual change here applies to both.
 */

import { useState, useId } from "react";
import { SightingMarkdown } from "@/components/sighting-markdown";

// ─── Swarm signal ────────────────────────────────────────────────────────────

function swarmLabel(count: number): { label: string; sublabel: string; fill: number } {
  if (count === 1) return { label: "Lone scout", sublabel: "A solitary rat. Brave.", fill: 1 };
  if (count <= 3) return { label: "Small pack", sublabel: "A couple of friends.", fill: 2 };
  if (count <= 7) return { label: "Growing colony", sublabel: "Things are getting ratty.", fill: 3 };
  if (count <= 15) return { label: "Swarm forming", sublabel: "Someone call an exterminator.", fill: 4 };
  if (count <= 40) return { label: "Full swarm", sublabel: "Absolute chaos.", fill: 5 };
  return { label: "Rat apocalypse", sublabel: "We bow to our new overlords.", fill: 6 };
}

const MAX_SLOTS = 6;

export function SwarmSignal({ count }: { count: number }) {
  const { label, sublabel, fill } = swarmLabel(count);
  return (
    <div className="flex flex-1 items-center gap-3 rounded-lg border border-stone-900/8 bg-stone-50/80 px-3 py-2 dark:border-white/8 dark:bg-stone-900/40">
      <div className="flex gap-0.5 text-base leading-none" aria-hidden>
        {Array.from({ length: MAX_SLOTS }).map((_, i) => (
          <span key={i} className={`transition-all duration-200 ${i < fill ? "opacity-100" : "opacity-15 grayscale"}`}>
            🐀
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-stone-700 dark:text-stone-200">{label}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">{sublabel}</p>
      </div>
    </div>
  );
}

// ─── Timestamp slider ────────────────────────────────────────────────────────

export function SightingTimestampField({
  defaultValue = 50,
  label = "Approx. point in movie",
  errorMessage,
}: {
  defaultValue?: number;
  label?: string;
  errorMessage?: string;
}) {
  const [percent, setPercent] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="h-5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-100"
              style={{ width: `${percent}%` }}
            />
          </div>
          {/* thumb */}
          <div
            className="pointer-events-none absolute top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[3px] rounded-full border-2 border-amber-600 bg-white shadow-md transition-all duration-100 dark:border-amber-400 dark:bg-stone-100"
            style={{ left: `${percent}%` }}
          >
            <span className="block h-3 w-px rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="block h-3 w-px rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="block h-3 w-px rounded-full bg-amber-500 dark:bg-amber-400" />
          </div>
          <input
            name="timestamp"
            type="range"
            min={0}
            max={100}
            step={1}
            value={percent}
            onChange={(e) => setPercent(Number.parseInt(e.currentTarget.value, 10) || 0)}
            aria-label={label}
            className="absolute inset-0 h-full w-full cursor-grab opacity-0 active:cursor-grabbing"
          />
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-black tabular-nums text-stone-950 dark:text-stone-50">
            {percent}%
          </span>
        </div>
      </div>
      {errorMessage ? (
        <span className="text-xs font-semibold text-red-700 dark:text-red-300">{errorMessage}</span>
      ) : null}
    </div>
  );
}

// ─── Rat count stepper ───────────────────────────────────────────────────────

export function SightingRatCountField({
  defaultValue = 1,
}: {
  defaultValue?: number;
}) {
  const [count, setCount] = useState(Math.max(1, defaultValue));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200">Approx. rats on screen</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border-2 border-stone-900/12 bg-white dark:border-white/12 dark:bg-stone-900">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            aria-label="Decrease rat count"
            className="flex h-10 w-10 items-center justify-center rounded-l-[10px] text-xl font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            −
          </button>
          <input
            name="approximateRatCount"
            type="number"
            min={1}
            max={999}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number.parseInt(e.currentTarget.value, 10) || 1))}
            className="w-12 border-x-2 border-stone-900/12 bg-transparent py-2 text-center text-base font-bold tabular-nums text-stone-900 outline-none dark:border-white/12 dark:text-stone-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(999, c + 1))}
            aria-label="Increase rat count"
            className="flex h-10 w-10 items-center justify-center rounded-r-[10px] text-xl font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            +
          </button>
        </div>
        <SwarmSignal count={count} />
      </div>
    </div>
  );
}

// ─── Description + markdown preview ─────────────────────────────────────────

export function SightingDescriptionField({
  defaultValue = "",
  required = false,
  errorMessage,
  minRows = 6,
}: {
  defaultValue?: string;
  required?: boolean;
  errorMessage?: string;
  minRows?: number;
}) {
  const [draft, setDraft] = useState(defaultValue);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewId = useId();

  const inputErrorClass =
    "border-red-700/70 focus-visible:border-red-700 dark:border-red-400/65 dark:focus-visible:border-red-400";

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
        <span>
          Description{required ? <span aria-hidden className="ml-1 text-red-600 dark:text-red-400">*</span> : null}
        </span>
        <textarea
          name="description"
          required={required}
          rows={minRows}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder="Describe exactly where the rat appears and what it is doing."
          aria-invalid={Boolean(errorMessage)}
          className={`wr-input h-auto resize-y py-3 leading-relaxed ${errorMessage ? inputErrorClass : ""}`}
          style={{ minHeight: `${minRows * 1.6}rem` }}
        />
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p className="max-w-prose text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-600 dark:text-stone-300">Markdown</span>{" "}
            is supported — bold, lists, links, headings. Open preview to check formatting.
          </p>
          <button
            type="button"
            onClick={() => setPreviewOpen((o) => !o)}
            aria-expanded={previewOpen}
            aria-controls={previewId}
            aria-label={previewOpen ? "Hide markdown preview" : "Show markdown preview"}
            className="wr-btn-ghost shrink-0 self-start px-3 py-1.5 text-xs"
          >
            {previewOpen ? "Hide preview" : "Show preview"}
          </button>
        </div>
        {errorMessage ? (
          <span className="text-xs font-semibold text-red-700 dark:text-red-300">{errorMessage}</span>
        ) : null}
      </label>
      {previewOpen ? (
        <div
          id={previewId}
          role="region"
          aria-label="Markdown preview"
          className="rounded-xl border border-stone-900/12 bg-stone-50/90 p-4 shadow-sm sm:p-5 dark:border-white/12 dark:bg-stone-950/45"
        >
          {draft.trim() ? (
            <SightingMarkdown markdown={draft} />
          ) : (
            <p className="text-sm italic text-stone-500 dark:text-stone-500">
              Start typing above — formatted output appears here.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
