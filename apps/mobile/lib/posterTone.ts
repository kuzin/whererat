/**
 * Server stores {@link Movie.posterTone} as Tailwind `bg-*` classes (see web catalog).
 * Map known classes to hex for React Native; unknown → fallback.
 */

import { Platform } from "react-native";

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

/** WCAG relative luminance for sRGB hex (`#rgb` optional `#`). Returns 0 if parse fails. */
export function relativeLuminance(hex: string): number {
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

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Linear mix toward `toward` (6-char hex) by `t` ∈ [0,1]. */
export function mixTowardHex(hex: string, toward: string, t: number): string {
  const parse = (h: string) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h.trim());
    if (!m) return null;
    return [Number.parseInt(m[1], 16), Number.parseInt(m[2], 16), Number.parseInt(m[3], 16)] as const;
  };
  const a = parse(hex);
  const b = parse(toward);
  if (!a || !b) return hex;
  const u = Math.max(0, Math.min(1, t));
  const r = clampByte(a[0] + (b[0] - a[0]) * u);
  const g = clampByte(a[1] + (b[1] - a[1]) * u);
  const bl = clampByte(a[2] + (b[2] - a[2]) * u);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/** Nudge extractor output so headers stay readable (not blown-out highlights / ink black). */
export function softenChromeHex(hex: string): string {
  const lum = relativeLuminance(hex);
  if (lum > 0.62) return mixTowardHex(hex, "#1c1917", 0.38);
  if (lum < 0.06) return mixTowardHex(hex, "#44403c", 0.22);
  return hex;
}

/** Resolve API `posterTone` (Tailwind class or `#rrggbb`) to a solid hex. */
export function posterToneToHex(tone: string | undefined, fallback: string): string {
  if (!tone?.trim()) return fallback;
  const asHex = parseHex(tone);
  if (asHex) return asHex;
  const mapped = TAILWIND_BG_HEX[tone.trim()];
  return mapped ?? fallback;
}

/** WCAG contrast ratio (≥1) for two sRGB `#rrggbb` surfaces. */
function wcagContrastRatio(fgHex: string, bgHex: string): number {
  const Lf = relativeLuminance(fgHex);
  const Lb = relativeLuminance(bgHex);
  const lighter = Math.max(Lf, Lb);
  const darker = Math.min(Lf, Lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Dark / light inks tuned for fills (chips), not `#1c1410` (slightly softer than pure black). */
const FG_ON_LIGHT_BG = "#0c0a09";
const FG_ON_DARK_BG = "#fafaf9";

/**
 * Readable text/icon fill on top of `bgHex`. Prefers whichever of dark vs light foreground
 * first meets WCAG AA (4.5∶1) for normal-sized copy; ties fall back to luminance midpoint.
 */
export function contrastingForeground(bgHex: string): string {
  const rd = wcagContrastRatio(FG_ON_LIGHT_BG, bgHex);
  const rl = wcagContrastRatio(FG_ON_DARK_BG, bgHex);
  const aa = 4.5;

  if (rd >= aa && rl >= aa) {
    return relativeLuminance(bgHex) > 0.45 ? FG_ON_LIGHT_BG : FG_ON_DARK_BG;
  }
  if (rd >= aa) return FG_ON_LIGHT_BG;
  if (rl >= aa) return FG_ON_DARK_BG;
  return rd >= rl ? FG_ON_LIGHT_BG : FG_ON_DARK_BG;
}

/**
 * Wordmark/back/title treatment for the transparent native header + hero strip.
 *
 * Android + light: sampled poster chrome reads **brighter** than the actual stack (blur + scrim tint
 * over hero art). We darken a copy for WCAG picks so white/cream wins on cinematic keys.
 */
export function movieHeroHeaderChrome(
  posterChromeBgHex: string,
  mode: "light" | "dark",
): { fg: string; statusBar: "light" | "dark" } {
  if (Platform.OS !== "android" || mode !== "light") {
    return {
      fg: contrastingForeground(posterChromeBgHex),
      statusBar: statusBarStyleForBackground(posterChromeBgHex),
    };
  }
  /** Stronger than the raw sample: blurred hero reads darker than centroid/extracted chrome. */
  const contrastBg = mixTowardHex(posterChromeBgHex, "#0c0a09", 0.72);
  const candidates = ["#ffffff", "#fef3c7", "#fafaf9"] as const;
  let fg = contrastingForeground(contrastBg);
  for (const ink of candidates) {
    if (wcagContrastRatio(ink, contrastBg) >= 4.5) {
      fg = ink;
      break;
    }
  }
  return { fg, statusBar: statusBarStyleForBackground(contrastBg) };
}

/** Expo / native-stack status bar style for text/icons over `bgHex`. */
export function statusBarStyleForBackground(bgHex: string): "light" | "dark" {
  return relativeLuminance(bgHex) > 0.45 ? "dark" : "light";
}
