"use client";

/**
 * Shared rich field components used by both the public Submit form and the
 * moderator Edit Sighting modal. Any visual change here applies to both.
 */

import { useState, useId, useRef } from "react";
import { SightingMarkdown } from "@/components/sighting-markdown";
import { RodentTypeIcon } from "@/components/rodent-type-icon";
import { CONTENT_WARNING_OPTIONS, RODENT_TYPE_OPTIONS, rodentCountFieldLabel, formatPercentAsTimestamp } from "@/lib/whererat";

// ─── Swarm signal ────────────────────────────────────────────────────────────

function swarmLabel(count: number, noun = "Rat"): { label: string; sublabel: string; fill: number } {
  if (count === 1) return { label: "Lone scout", sublabel: "A solitary one. Brave.", fill: 1 };
  if (count <= 3) return { label: "Small pack", sublabel: "A cozy little crew.", fill: 2 };
  if (count <= 7) return { label: "Growing colony", sublabel: "Now we're talking.", fill: 3 };
  if (count <= 15) return { label: "Swarm forming", sublabel: "A glorious gathering.", fill: 4 };
  if (count <= 40) return { label: "Full swarm", sublabel: "An absolute delight.", fill: 5 };
  return { label: `${noun} apocalypse`, sublabel: "We bow to our new overlords.", fill: 6 };
}

const MAX_SLOTS = 6;

export function SwarmSignal({ count, openmojiCode = "1F400", rodentId, noun = "Rat" }: { count: number; openmojiCode?: string; rodentId?: string; noun?: string }) {
  const { label, sublabel, fill } = swarmLabel(count, noun);
  return (
    <div className="flex flex-1 items-center gap-3 rounded-lg border border-stone-900/8 bg-stone-50/80 px-3 py-2 dark:border-white/8 dark:bg-stone-900/40">
      <div className="flex gap-0.5 items-center leading-none" aria-hidden>
        {Array.from({ length: MAX_SLOTS }).map((_, i) => (
          <span key={i} className={`transition-all duration-200 ${i < fill ? "opacity-100" : "opacity-15 grayscale"}`}>
            <RodentTypeIcon openmojiCode={openmojiCode} label="" rodentId={rodentId} size={18} />
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
  runtimeMinutes,
}: {
  defaultValue?: number;
  label?: string;
  errorMessage?: string;
  runtimeMinutes?: number;
}) {
  const [percent, setPercent] = useState(defaultValue);
  const calculatedTimestamp = runtimeMinutes ? formatPercentAsTimestamp(`${percent}%`, runtimeMinutes) : null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200">{label}</p>
      <div className="mt-1 flex items-center gap-6">
        <div className="relative flex-1">
          <div className="h-5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-100 opacity-80"
              style={{
                width: `${percent}%`,
                backgroundImage: "url('/brand/cheese-texture-shutterstock.jpg')",
                backgroundSize: "120px",
                backgroundPosition: "0 0"
              }}
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
        <div className={`shrink-0 text-right ${runtimeMinutes && runtimeMinutes >= 60 ? "min-w-[8.5rem]" : runtimeMinutes ? "min-w-[6.5rem]" : "min-w-[3.5rem]"}`}>
          <span className="text-2xl font-black tabular-nums text-stone-950 dark:text-stone-50">
            <span className="inline-block min-w-[3ch] text-right">{percent}</span>%{calculatedTimestamp && <span className="text-stone-500 dark:text-stone-400"> · {calculatedTimestamp}</span>}
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
  label,
  openmojiCode,
  rodentId,
  noun,
}: {
  defaultValue?: number;
  label?: string;
  openmojiCode?: string;
  rodentId?: string;
  noun?: string;
}) {
  const [count, setCount] = useState(Math.max(1, defaultValue));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200">{label ?? "Rats on screen"}</p>
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
        <SwarmSignal count={count} openmojiCode={openmojiCode} rodentId={rodentId} noun={noun} />
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

// ─── Content warnings ─────────────────────────────────────────────────────────

/**
 * Toggle-gated content warning picker shared by the Submit form and Edit Sighting modal.
 *
 * - Off by default; checkboxes are hidden until the toggle is switched on.
 * - Predefined options render as pill-style toggle chips.
 * - "Other" chip reveals a text input for a custom warning string.
 */
export function SightingContentWarningsField({
  initialWarnings,
  embedded = false,
}: {
  initialWarnings?: string[];
  /**
   * When true, renders without the outer rounded-border wrapper so the field
   * can be embedded inside an existing card (e.g. the spoiler toggle card).
   * The toggle row gets a top border to visually separate from the row above.
   */
  embedded?: boolean;
}) {
  const knownIds = CONTENT_WARNING_OPTIONS.map((o) => o.id) as string[];
  const initialKnown = (initialWarnings ?? []).filter((w) => knownIds.includes(w));
  const initialOther = (initialWarnings ?? []).find((w) => !knownIds.includes(w)) ?? "";

  const hasInitial = (initialWarnings?.length ?? 0) > 0;
  const [enabled, setEnabled] = useState(hasInitial);
  const [checked, setChecked] = useState<Set<string>>(new Set(initialKnown));
  const [otherOn, setOtherOn] = useState(Boolean(initialOther));
  const [otherText, setOtherText] = useState(initialOther);
  const otherTextareaRef = useRef<HTMLTextAreaElement>(null);

  function toggleChip(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleOther() {
    setOtherOn((v) => {
      if (!v) requestAnimationFrame(() => otherTextareaRef.current?.focus());
      return !v;
    });
  }

  const pillBase =
    "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150";
  const pillOff =
    "border-stone-300/80 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-800 dark:border-white/12 dark:bg-stone-800/60 dark:text-stone-400 dark:hover:border-white/25 dark:hover:text-stone-200";
  const pillOn =
    "border-amber-500/70 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-900/30 dark:text-amber-200";

  const toggleRow = (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-white/5 ${embedded ? "border-t border-stone-900/8 dark:border-white/8" : ""
        }`}
    >
      <div className="min-w-0">
        <span className="block">Contains content warnings</span>
        <span className="mt-0.5 block text-xs font-medium text-stone-500 dark:text-stone-400">
          e.g. rat dies, harmed, or other disturbing content
        </span>
      </div>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            if (!e.target.checked) {
              setChecked(new Set());
              setOtherOn(false);
              setOtherText("");
            }
          }}
        />
        <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );

  const picker = enabled ? (
    <div className="border-t border-stone-900/8 px-4 pb-4 pt-3 dark:border-white/8">
      <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500">
        Select all that apply
      </p>
      <div className="flex flex-wrap gap-2">
        {CONTENT_WARNING_OPTIONS.map((option) => {
          const isOn = checked.has(option.id);
          return (
            <label key={option.id} className={`${pillBase} ${isOn ? pillOn : pillOff}`}>
              <input
                type="checkbox"
                name="contentWarnings"
                value={option.id}
                checked={isOn}
                onChange={() => toggleChip(option.id)}
                className="sr-only"
              />
              <img
                src={`/openmoji/color/svg/${option.openmojiCode}.svg`}
                alt=""
                width={16}
                height={16}
                aria-hidden
              />
              {option.label}
            </label>
          );
        })}

        {/* Other chip */}
        <label className={`${pillBase} ${otherOn ? pillOn : pillOff}`}>
          <input
            type="checkbox"
            checked={otherOn}
            onChange={handleToggleOther}
            className="sr-only"
          />
          <span aria-hidden><img src="/openmoji/color/svg/270F.svg" alt="" width={16} height={16} style={{ display: "inline", verticalAlign: "middle" }} /></span>
          Other
        </label>
      </div>

      {otherOn ? (
        <div className="mt-3">
          <textarea
            ref={otherTextareaRef}
            name="contentWarningOther"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Describe the content warning…"
            maxLength={200}
            rows={2}
            className="wr-input h-auto w-full resize-none py-2.5 text-sm leading-relaxed"
          />
        </div>
      ) : null}
    </div>
  ) : null;

  const hiddenInput = (
    <input type="hidden" name="contentWarningEnabled" value={enabled ? "1" : "0"} />
  );

  if (embedded) {
    return (
      <>
        {toggleRow}
        {picker}
        {hiddenInput}
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-900/12 bg-stone-50 dark:border-white/10 dark:bg-stone-900/50">
      {toggleRow}
      {picker}
      {hiddenInput}
    </div>
  );
}

// ─── Rodent type picker ───────────────────────────────────────────────────────

/**
 * Multi-select pill chips for the type(s) of rodent in the sighting.
 * "Rat" is selected by default.
 */
export function SightingRodentTypesField({
  initialTypes,
  onTypesChange,
}: {
  initialTypes?: string[];
  onTypesChange?: (types: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialTypes ?? ["rat"]),
  );

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      // Always keep at least one selected
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
    onTypesChange?.(Array.from(next));
  }

  const pillBase =
    "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150";
  const pillOff =
    "border-stone-300/80 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-800 dark:border-white/12 dark:bg-stone-800/60 dark:text-stone-400 dark:hover:border-white/25 dark:hover:text-stone-200";
  const pillOn =
    "border-amber-500/70 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-900/30 dark:text-amber-200";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
        Rodent type
      </p>
      <div className="flex flex-wrap gap-2">
        {RODENT_TYPE_OPTIONS.map((option) => {
          const isOn = selected.has(option.id);
          return (
            <label key={option.id} className={`${pillBase} ${isOn ? pillOn : pillOff}`}>
              <input
                type="checkbox"
                name="rodentTypes"
                value={option.id}
                checked={isOn}
                onChange={() => toggle(option.id)}
                className="sr-only"
              />
              <RodentTypeIcon
                openmojiCode={option.openmojiCode}
                label={option.label}
                rodentId={option.id}
                size={20}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
