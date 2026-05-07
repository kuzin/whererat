/**
 * Server stores {@link Movie.posterTone} as Tailwind `bg-*` classes (see web catalog).
 * Map known classes to hex for React Native; unknown → fallback.
 */

const TAILWIND_BG_HEX: Record<string, string> = {
  // stone
  "bg-stone-50": "#fafaf9",
  "bg-stone-100": "#f5f5f4",
  "bg-stone-200": "#e7e5e4",
  "bg-stone-300": "#d6d3d1",
  "bg-stone-400": "#a8a29e",
  "bg-stone-500": "#78716c",
  "bg-stone-600": "#57534e",
  "bg-stone-700": "#44403c",
  "bg-stone-800": "#292524",
  "bg-stone-900": "#1c1917",
  "bg-stone-950": "#0c0a09",
  // slate
  "bg-slate-700": "#334155",
  "bg-slate-800": "#1e293b",
  "bg-slate-900": "#0f172a",
  "bg-slate-950": "#020617",
  // zinc
  "bg-zinc-800": "#27272a",
  "bg-zinc-900": "#18181b",
  "bg-zinc-950": "#09090b",
  // neutral
  "bg-neutral-800": "#262626",
  "bg-neutral-900": "#171717",
  "bg-neutral-950": "#0a0a0a",
  // red / rose (common keys)
  "bg-red-900": "#7f1d1d",
  "bg-red-950": "#450a0a",
  "bg-rose-900": "#881337",
  "bg-rose-950": "#4c0519",
  // orange / amber
  "bg-orange-900": "#7c2d12",
  "bg-orange-950": "#431407",
  "bg-amber-900": "#78350f",
  "bg-amber-950": "#451a03",
};

function parseHex(input: string): string | null {
  const s = input.trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(s);
  return m ? `#${m[1].toLowerCase()}` : null;
}

function relativeLuminance(hex: string): number {
  const raw = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!raw) return 0;
  const chan = (x: string) => {
    const c = Number.parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = chan(raw[1]);
  const g = chan(raw[2]);
  const b = chan(raw[3]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Resolve API `posterTone` (Tailwind class or `#rrggbb`) to a solid hex. */
export function posterToneToHex(tone: string | undefined, fallback: string): string {
  if (!tone?.trim()) return fallback;
  const asHex = parseHex(tone);
  if (asHex) return asHex;
  const mapped = TAILWIND_BG_HEX[tone.trim()];
  return mapped ?? fallback;
}

/** Readable primary text/icon color on top of `bgHex`. */
export function contrastingForeground(bgHex: string): string {
  return relativeLuminance(bgHex) > 0.45 ? "#1c1917" : "#fafaf9";
}

/** Expo / native-stack status bar style for text/icons over `bgHex`. */
export function statusBarStyleForBackground(bgHex: string): "light" | "dark" {
  return relativeLuminance(bgHex) > 0.45 ? "dark" : "light";
}
