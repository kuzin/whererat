import { upsizeAmazonPosterUrl } from "@/lib/amazon-poster-url";
import type { Movie } from "@/lib/whererat";
import {
  deriveDarkMoviePagePalette,
  extractMoviePagePalette,
  type MoviePagePalette,
} from "@/lib/movie-page-palette";
import { getTmdbBackdropUrl } from "@/lib/tmdb-banner";

export type MoviePageVisuals = {
  bannerUrl: string;
  /** True when sourced from TMDB widescreen backdrop (not cropped poster art) */
  bannerIsWidescreen: boolean;
  palette: MoviePagePalette | null;
  paletteDark: MoviePagePalette | null;
  /** Synced/default banner before any manual override is applied. */
  syncedBannerUrl: string;
  syncedBannerIsWidescreen: boolean;
  syncedPalette: MoviePagePalette | null;
  syncedPaletteDark: MoviePagePalette | null;
  usingManualPalette: boolean;
  usingManualPaletteDark: boolean;
};

function parseManualPalette(movie: Movie): MoviePagePalette | null {
  const raw = movie.metadata.pagePalette;
  return parsePaletteObject(raw);
}

function parseManualDarkPalette(movie: Movie): MoviePagePalette | null {
  const raw = movie.metadata.pagePaletteDark;
  return parsePaletteObject(raw);
}

function parsePaletteObject(raw: unknown): MoviePagePalette | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const hex = /^#?[0-9a-fA-F]{6}$/;
  const normalize = (v: unknown): string | null => {
    if (typeof v !== "string" || !hex.test(v.trim())) return null;
    const t = v.trim();
    return t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`;
  };
  const wash = normalize(obj.wash);
  const columnWash = normalize(obj.columnWash);
  const accent = normalize(obj.accent);
  const heroBloom = normalize(obj.heroBloom);
  if (!wash || !columnWash || !accent || !heroBloom) return null;
  return { wash, columnWash, accent, heroBloom };
}

export async function getSyncedMoviePageVisuals(movie: Movie): Promise<{
  bannerUrl: string;
  bannerIsWidescreen: boolean;
  palette: MoviePagePalette | null;
  paletteDark: MoviePagePalette | null;
}> {
  const enlargedPoster = upsizeAmazonPosterUrl(movie.posterUrl);
  const tmdbBackdrop = await getTmdbBackdropUrl({
    tmdbId: movie.externalIds.tmdb,
    imdbId: movie.externalIds.imdb,
  });
  const posterCandidate = enlargedPoster || movie.posterUrl;
  const movieTitlePlaceholder = `https://placehold.co/1200x600/292524/fef3c7/png?text=${encodeURIComponent(movie.title)}`;

  const bannerUrl =
    tmdbBackdrop ||
    posterCandidate ||
    movieTitlePlaceholder;
  const bannerIsWidescreen = Boolean(tmdbBackdrop);

  const palette =
    (await extractMoviePagePalette(bannerUrl)) ??
    (posterCandidate ? await extractMoviePagePalette(posterCandidate) : null) ??
    (await extractMoviePagePalette(movie.posterUrl));
  const paletteDark = palette ? deriveDarkMoviePagePalette(palette) : null;

  return { bannerUrl, bannerIsWidescreen, palette, paletteDark };
}

export async function getMoviePageVisuals(movie: Movie): Promise<MoviePageVisuals> {
  const synced = await getSyncedMoviePageVisuals(movie);
  const manualPalette = parseManualPalette(movie);
  const manualPaletteDark = parseManualDarkPalette(movie);

  return {
    bannerUrl: synced.bannerUrl,
    bannerIsWidescreen: synced.bannerIsWidescreen,
    palette: manualPalette ?? synced.palette,
    paletteDark: manualPaletteDark ?? synced.paletteDark,
    syncedBannerUrl: synced.bannerUrl,
    syncedBannerIsWidescreen: synced.bannerIsWidescreen,
    syncedPalette: synced.palette,
    syncedPaletteDark: synced.paletteDark,
    usingManualPalette: Boolean(manualPalette),
    usingManualPaletteDark: Boolean(manualPaletteDark),
  };
}
