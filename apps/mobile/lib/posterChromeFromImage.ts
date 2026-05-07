import { getColors, type ImageColorsResult } from "react-native-image-colors";

import { softenChromeHex } from "./posterTone";

function normalizeToHex(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(s);
  return m ? `#${m[1].toLowerCase()}` : null;
}

function pickRawFromResult(result: ImageColorsResult): string | undefined {
  switch (result.platform) {
    case "ios":
      return result.background || result.primary || result.secondary;
    case "android":
      return result.darkMuted || result.muted || result.darkVibrant || result.vibrant || result.dominant;
    case "web":
      return result.darkMuted || result.muted || result.darkVibrant || result.vibrant || result.dominant;
    default:
      return undefined;
  }
}

export type ExtractPosterChromeOptions = {
  /** When extraction fails, library uses this hex internally; we also return null to let caller fallback. */
  fallback: string;
  /** Cache key (e.g. movie slug)—avoid tying only to URL length limits. */
  cacheKey: string;
};

/** Dominant-ish hex from poster image URI (native + web). Returns null if unusable. */
export async function extractChromeFromPosterUri(
  uri: string,
  { fallback, cacheKey }: ExtractPosterChromeOptions,
): Promise<string | null> {
  const trimmed = uri.trim();
  if (!trimmed) return null;

  try {
    const result = await getColors(trimmed, {
      fallback,
      cache: true,
      key: cacheKey,
      quality: "low",
    });
    const raw = pickRawFromResult(result);
    const hex = normalizeToHex(raw);
    if (!hex) return null;
    return softenChromeHex(hex);
  } catch {
    return null;
  }
}
