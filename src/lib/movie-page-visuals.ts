import { upsizeAmazonPosterUrl } from "@/lib/amazon-poster-url";
import type { Movie } from "@/lib/whererat";
import { extractMoviePagePalette, type MoviePagePalette } from "@/lib/movie-page-palette";
import { getTmdbBackdropUrl } from "@/lib/tmdb-banner";

export type MoviePageVisuals = {
  bannerUrl: string;
  /** True when sourced from TMDB widescreen backdrop (not cropped poster art) */
  bannerIsWidescreen: boolean;
  palette: MoviePagePalette | null;
};

export async function getMoviePageVisuals(movie: Movie): Promise<MoviePageVisuals> {
  const enlargedPoster = upsizeAmazonPosterUrl(movie.posterUrl);
  const tmdbBackdrop = await getTmdbBackdropUrl({
    tmdbId: movie.externalIds.tmdb,
    imdbId: movie.externalIds.imdb,
  });

  const bannerUrl = tmdbBackdrop ?? enlargedPoster ?? movie.posterUrl;
  const bannerIsWidescreen = Boolean(tmdbBackdrop);

  const palette =
    (await extractMoviePagePalette(bannerUrl)) ??
    (await extractMoviePagePalette(enlargedPoster)) ??
    (await extractMoviePagePalette(movie.posterUrl));

  return { bannerUrl, bannerIsWidescreen, palette };
}
