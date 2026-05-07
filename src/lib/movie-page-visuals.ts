import { upsizeAmazonPosterUrl } from "@/lib/amazon-poster-url";
import type { Movie } from "@/lib/whererat";
import { extractMoviePagePalette, type MoviePagePalette } from "@/lib/movie-page-palette";
import { getTmdbBackdropUrl } from "@/lib/tmdb-banner";

export type MoviePageVisuals = {
  bannerUrl: string;
  /** True when sourced from TMDB widescreen backdrop (not cropped poster art) */
  bannerIsWidescreen: boolean;
  palette: MoviePagePalette | null;
  /** Synced/default banner before any manual override is applied. */
  syncedBannerUrl: string;
  syncedBannerIsWidescreen: boolean;
  syncedPalette: MoviePagePalette | null;
  usingManualPalette: boolean;
};

function parseManualPalette(movie: Movie): MoviePagePalette | null {
  const raw = movie.metadata.pagePalette;
  if (!raw) return null;
  const hex = /^#?[0-9a-fA-F]{6}$/;
  const normalize = (v: unknown): string | null => {
    if (typeof v !== "string" || !hex.test(v.trim())) return null;
    const t = v.trim();
    return t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`;
  };
  const wash = normalize(raw.wash);
  const columnWash = normalize(raw.columnWash);
  const accent = normalize(raw.accent);
  const heroBloom = normalize(raw.heroBloom);
  if (!wash || !columnWash || !accent || !heroBloom) return null;
  return { wash, columnWash, accent, heroBloom };
}

export async function getSyncedMoviePageVisuals(movie: Movie): Promise<{
  bannerUrl: string;
  bannerIsWidescreen: boolean;
  palette: MoviePagePalette | null;
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

  return { bannerUrl, bannerIsWidescreen, palette };
}

export async function getMoviePageVisuals(movie: Movie): Promise<MoviePageVisuals> {
  const synced = await getSyncedMoviePageVisuals(movie);
  const manualPalette = parseManualPalette(movie);

  return {
    bannerUrl: synced.bannerUrl,
    bannerIsWidescreen: synced.bannerIsWidescreen,
    palette: manualPalette ?? synced.palette,
    syncedBannerUrl: synced.bannerUrl,
    syncedBannerIsWidescreen: synced.bannerIsWidescreen,
    syncedPalette: synced.palette,
    usingManualPalette: Boolean(manualPalette),
  };
}
