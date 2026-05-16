"use client";

import { useRef, useState } from "react";

/**
 * Accent color picker for the movie edit modal.
 *
 * - Clicking the swatch opens the native <input type="color"> picker.
 * - The text input shows the current hex; editing it updates the swatch.
 * - Clearing the text input (or clicking ×) resets to "auto" (no override).
 * - The hidden <input name="overrideAccent"> is what the form actually submits.
 */
export function AccentColorField({
  autoAccent,
  currentOverride,
}: {
  /** The auto-derived accent from the synced palette. */
  autoAccent: string;
  /** Stored override value, or empty string if none. */
  currentOverride: string;
}) {
  const [hex, setHex] = useState(currentOverride || "");
  const pickerRef = useRef<HTMLInputElement>(null);

  // The color shown on the swatch: override if set, else the auto-derived color.
  const swatchColor = isValidHex(hex) ? normalizeHex(hex) : autoAccent;

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHex(e.target.value); // native picker always gives a valid #rrggbb
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHex(e.target.value);
  }

  function handleClear() {
    setHex("");
  }

  // The submitted value: normalized hex if valid, else empty (= use auto).
  const submitValue = isValidHex(hex) ? normalizeHex(hex) : "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Swatch — clicking opens the hidden native color picker */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          title="Pick a color"
          aria-label="Open color picker"
          className="relative h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-stone-300 dark:border-stone-600 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ backgroundColor: swatchColor }}
        >
          {/* Hidden native color picker — positioned over the button so it opens on click */}
          <input
            ref={pickerRef}
            type="color"
            value={swatchColor}
            onChange={handlePickerChange}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        {/* Hex text input */}
        <input
          type="text"
          value={hex}
          onChange={handleTextChange}
          placeholder={`Auto (${autoAccent})`}
          className="wr-input font-mono min-w-0 flex-1"
          spellCheck={false}
          autoComplete="off"
        />

        {/* Clear button — only shown when an override is active */}
        {hex ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear override — use auto-derived color"
            aria-label="Clear color override"
            className="shrink-0 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        ) : null}

        {/* The actual form field — always submits a clean hex or empty string */}
        <input type="hidden" name="overrideAccent" value={submitValue} />
      </div>
      <span className="text-xs font-normal text-stone-400 dark:text-stone-500">
        Click the swatch to pick, or type a hex. Leave blank to use the auto-derived color.
      </span>
    </div>
  );
}

function isValidHex(value: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(value.trim());
}

function normalizeHex(value: string): string {
  const t = value.trim();
  return t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`;
}
