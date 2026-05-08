import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getMoviePageVisuals } from "@/lib/movie-page-visuals";
import { getMergedSightingsForMovie } from "@/lib/moderation-store";
import { MODERATOR_SESSION_COOKIE, parseModeratorSession } from "@/lib/auth";
import { applyMovieOverride, getDeletedMovieIds, getMovieOverride } from "@/lib/movie-edit-store";
import { MovieSightingsCards } from "./movie-sightings-cards";
import { MovieTabsShell } from "./movie-tabs-shell";
import { MovieRatviewsTab } from "./movie-ratviews-tab";
import { MovieRatlatedTab } from "./movie-ratlated-tab";
import { MovieRatMediaTab } from "./movie-rat-media-tab";
import { tabCardClass, tabHeaderBorderClass } from "./movie-tab-classes";
import { MovieSightingsPagingBar, MovieSightingsSortControl } from "./movie-sightings-toolbar";
import { EditableSightingImagesField } from "@/components/editable-sighting-images-field";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ImdbLinkButton } from "@/components/imdb-link-button";
import {
  deleteMovie,
  deleteSighting,
  resyncMovieFromImdb,
  updateMovieInfo,
  updateSightingInfo,
} from "./actions";
import {
  buildMovieSightingsPath,
  estimateRatsForAppearance,
  formatRuntimeMinutes,
  getImdbNameSearchUrl,
  getImdbTitleUrl,
  getSightingImageRefs,
  getSightingTimestampPercent,
  parseMovieSightingsPageParam,
  parseMovieSightingsSortParam,
  prepareMovieSightingsView,
  getMovieSightingsSortOptions,
  splitImdbCreditSegments,
  type Movie,
} from "@/lib/whererat";
import { getCatalogMovieBySlug, getCatalogMovies } from "@/lib/movie-catalog";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseMovie = await getCatalogMovieBySlug(slug);
  if (!baseMovie) return {};

  const movieOverride = await getMovieOverride(baseMovie.id);
  const movie = applyMovieOverride(baseMovie, movieOverride);

  const sightings = await getMergedSightingsForMovie(movie.id);
  const count = sightings.length;
  const s = count === 1 ? "" : "s";

  const title = `${movie.title} (${movie.releaseYear}) — Rat Sightings on WhereRat`;
  const description = `See where rats appear in ${movie.title}. ${count} rat sighting${s} catalogued on WhereRat.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: movie.posterUrl, width: 300, height: 450, alt: movie.title }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function parseHexColor(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function sRgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickReadableInk(accentHex: string): string {
  const accent = parseHexColor(accentHex);
  if (!accent) return "#fff";
  const softBlack: [number, number, number] = [28, 25, 23];
  const white: [number, number, number] = [255, 255, 255];
  return contrastRatio(accent, white) >= contrastRatio(accent, softBlack)
    ? "#fff"
    : "rgb(28 25 23)";
}

function trimMeta(value: string | undefined): string {
  return value?.trim() ?? "";
}

function readSeriesYearRange(snapshot: Record<string, unknown> | undefined): string | undefined {
  const raw =
    typeof snapshot?.Year === "string"
      ? snapshot.Year
      : typeof snapshot?.year === "string"
        ? snapshot.year
        : "";
  const cleaned = raw.trim();
  if (!cleaned) return undefined;
  return cleaned.replace("-", "–");
}

function readSeriesTotalSeasons(snapshot: Record<string, unknown> | undefined): number | undefined {
  const raw = snapshot?.totalSeasons ?? snapshot?.TotalSeasons;
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

function readSeriesTotalEpisodes(snapshot: Record<string, unknown> | undefined): number | undefined {
  const raw = snapshot?.totalEpisodes ?? snapshot?.TotalEpisodes ?? snapshot?.episodeCount;
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

function movieHeroMetaLine(movie: Movie, isSeriesTitle: boolean): string | null {
  const parts: string[] = [];
  const syncSnapshot = movie.metadata.syncSnapshot as Record<string, unknown> | undefined;

  if (isSeriesTitle) {
    const yearRange = readSeriesYearRange(syncSnapshot) ?? String(movie.releaseYear);
    parts.push(yearRange);
    const totalSeasons = readSeriesTotalSeasons(syncSnapshot);
    const totalEpisodes = readSeriesTotalEpisodes(syncSnapshot);
    if (totalSeasons) {
      parts.push(`${totalSeasons} ${totalSeasons === 1 ? "season" : "seasons"}`);
    }
    if (totalEpisodes) {
      parts.push(`${totalEpisodes} ${totalEpisodes === 1 ? "episode" : "episodes"}`);
    }
  } else {
    if (Number.isFinite(movie.releaseYear) && movie.releaseYear > 0) {
      parts.push(String(movie.releaseYear));
    }
    if (Number.isFinite(movie.runtimeMinutes) && movie.runtimeMinutes > 0) {
      parts.push(`${movie.runtimeMinutes} min`);
    }
  }
  const rating = trimMeta(movie.metadata.rating);
  if (rating) parts.push(rating);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

const sidebarSectionTitleClass =
  "wr-display text-[0.9375rem] font-bold uppercase tracking-[0.36em] text-stone-600 dark:text-stone-300 sm:text-base";
const sidebarDtClass =
  "text-xs font-bold uppercase tracking-[0.11em] text-stone-600 dark:text-stone-300 sm:text-[0.8125rem]";

function ImdbCreditsInline({ line }: { line: string }) {
  const segments = splitImdbCreditSegments(line);

  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={`${segment}-${index}`}>
          {index > 0 ? ", " : null}
          <a
            href={getImdbNameSearchUrl(segment)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-stone-900 underline decoration-stone-400/85 decoration-1 underline-offset-[3px] transition hover:text-amber-950 hover:decoration-amber-600 dark:text-amber-50 dark:decoration-amber-500/65 dark:hover:text-amber-100 dark:hover:decoration-amber-400"
          >
            {segment}
          </a>
        </Fragment>
      ))}
    </>
  );
}

/** Sample pixels with sharp (Node). */
export const runtime = "nodejs";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateStaticParams() {
  const allMovies = await getCatalogMovies();
  return allMovies.map((movie) => ({ slug: movie.slug }));
}

export default async function MoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: SearchParams;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const baseMovie = await getCatalogMovieBySlug(slug);

  if (!baseMovie) {
    notFound();
  }
  const deletedMovieIds = await getDeletedMovieIds();
  if (deletedMovieIds.has(baseMovie.id)) {
    notFound();
  }
  const movieOverride = await getMovieOverride(baseMovie.id);
  const movie = applyMovieOverride(baseMovie, movieOverride);
  const editMovie = single(query.editMovie) === "1";
  const editSightingId = single(query.editSighting)?.trim() ?? "";
  const cookieStore = await cookies();
  const moderatorSession = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  const canEditMovie = moderatorSession?.role === "owner";
  const canEditSightings = Boolean(moderatorSession);

  const sort = parseMovieSightingsSortParam(single(query.sort));
  const page = parseMovieSightingsPageParam(single(query.page));

  const movieSightings = await getMergedSightingsForMovie(movie.id);
  const isSeriesTitle = movieSightings.some((sighting) => sighting.imdbKind === "series");
  const allowedSorts = getMovieSightingsSortOptions(isSeriesTitle);
  const safeSort = allowedSorts.includes(sort) ? sort : "newest";
  const movieSpoilerCount = movieSightings.filter((s) => s.spoiler).length;
  const approxRatsInMovie = movieSightings.reduce(
    (sum, s) => sum + estimateRatsForAppearance(s),
    0,
  );
  const sightingsView = prepareMovieSightingsView({
    items: movieSightings,
    sort: safeSort,
    page,
    runtimeMinutes: movie.runtimeMinutes,
  });

  if (page !== sightingsView.safePage || safeSort !== sort) {
    redirect(
      buildMovieSightingsPath(slug, {
        sort: safeSort,
        page: sightingsView.safePage,
      }),
    );
  }

  const { pageSlice } = sightingsView;
  const sightingsBasePath = buildMovieSightingsPath(slug, {
    sort: safeSort,
    page: sightingsView.safePage,
  });
  const editingSighting = editSightingId
    ? movieSightings.find((item) => item.id === editSightingId)
    : undefined;
  const editingSightingImages = editingSighting
    ? getSightingImageRefs(editingSighting)
    : [];
  const visuals = await getMoviePageVisuals(movie);
  const palette = visuals.palette;
  const heroMetaLine = movieHeroMetaLine(movie, isSeriesTitle);
  const manualPalette = movie.metadata.pagePalette;
  const manualPaletteDark = movie.metadata.pagePaletteDark;
  const darkPalette = manualPaletteDark ?? visuals.paletteDark;

  const rootStyle: CSSProperties | undefined = palette
    ? ({
        "--movie-wash": palette.wash,
        "--movie-column-wash": palette.columnWash,
        "--movie-accent": palette.accent,
        "--movie-accent-ink": pickReadableInk(palette.accent),
        "--movie-hero-bloom": palette.heroBloom,
        "--movie-wash-dark": darkPalette?.wash ?? palette.wash,
        "--movie-column-wash-dark": darkPalette?.columnWash ?? palette.columnWash,
        "--movie-accent-dark": darkPalette?.accent ?? palette.accent,
        "--movie-accent-ink-dark": pickReadableInk(darkPalette?.accent ?? palette.accent),
        "--movie-hero-bloom-dark":
          darkPalette?.heroBloom ?? palette.heroBloom,
      } as CSSProperties)
    : undefined;

  const director = trimMeta(movie.metadata.director);
  const originalLanguage = trimMeta(movie.metadata.originalLanguage);
  const countriesLine = movie.metadata.productionCountries
    .map((c) => c.trim())
    .filter(Boolean)
    .join(", ");
  const runtimeLabel = formatRuntimeMinutes(movie.runtimeMinutes);
  const certificate = trimMeta(movie.metadata.rating);
  const writers = trimMeta(movie.metadata.writers);
  const cast = trimMeta(movie.metadata.cast);
  const awards = trimMeta(movie.metadata.awards);
  const ratFacts = (movie.metadata.ratFacts ?? []).filter((f) => f.trim());
  const imdbReviews = movie.metadata.imdbReviews ?? [];
  const imdbRelated = movie.metadata.imdbRelated ?? [];
  const imdbVideos = movie.metadata.imdbVideos ?? [];
  const imdbImages = movie.metadata.imdbImages ?? [];
  const imdbRating = trimMeta(movie.metadata.imdbRating);
  const imdbVotes = trimMeta(movie.metadata.imdbVotes);
  const metascore = trimMeta(movie.metadata.metascore);
  const imdbTitleUrlResolved = getImdbTitleUrl(movie.externalIds.imdb);
  const hasDetailsSection = Boolean(
    runtimeLabel ||
      certificate ||
      imdbRating ||
      metascore ||
      writers ||
      director ||
      cast ||
      originalLanguage ||
      countriesLine ||
      awards,
  );

  return (
    <main
      style={rootStyle}
      className="wr-page-shell py-8 sm:py-10"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/#catalog"
          className="wr-btn-ghost inline-flex h-11 items-center px-4 text-xs font-semibold uppercase tracking-[0.16em]"
        >
          ← Back to catalog
        </Link>
        <div className="flex items-center gap-2">
          {canEditMovie ? (
            <div className="flex items-center gap-2">
              <form action={resyncMovieFromImdb}>
                <input type="hidden" name="slug" value={slug} />
                <button
                  type="submit"
                  className="wr-btn-ghost inline-flex h-11 items-center px-3 text-xs font-semibold uppercase tracking-[0.12em]"
                >
                  Resync
                </button>
              </form>
              <form action={deleteMovie}>
                <input type="hidden" name="slug" value={slug} />
                <ConfirmSubmitButton
                  confirmMessage="Delete this movie? This cannot be undone."
                  type="submit"
                  className="wr-btn-ghost inline-flex h-11 items-center px-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-800 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/35"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
              <Link
                href={`/movies/${slug}?editMovie=1`}
                className="wr-btn-ghost inline-flex h-11 w-11 items-center justify-center px-0 text-lg"
                aria-label="Edit movie information"
                title="Edit movie information"
              >
                ✎
              </Link>
            </div>
          ) : null}
          <Link
            href={`/submit?for=${encodeURIComponent(movie.externalIds.imdb)}&title=${encodeURIComponent(movie.title)}&year=${encodeURIComponent(String(movie.releaseYear))}&poster=${encodeURIComponent(movie.posterUrl)}`}
            className={`inline-flex h-11 items-center gap-1.5 text-sm ${palette ? "wr-btn wr-btn-movie" : "wr-btn-primary"}`}
          >
            Submit a Sighting
          </Link>
        </div>
      </div>

      <section
        className={`wr-cheese-panel mt-6 overflow-hidden ${palette ? "movie-page-palette-bg" : "wr-cheese-tile-cream"}`}
      >
        <div className="relative min-h-[min(22rem,70vw)] overflow-hidden border-b-2 border-stone-950/85 dark:border-white/14 sm:min-h-80">
          <Image
            src={visuals.bannerUrl}
            alt={
              visuals.bannerIsWidescreen
                ? `${movie.title} theatrical backdrop (TMDB)`
                : `${movie.title} poster artwork (wide header crop)`
            }
            width={1280}
            height={720}
            className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
            priority
            sizes="100vw"
          />
          {palette ? (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 100% 90% at 15% -5%, color-mix(in srgb, var(--movie-hero-bloom) 38%, transparent) 0%, transparent 55%),
                  linear-gradient(to top, rgb(12 10 9 / 0.9) 0%, rgb(12 10 9 / 0.58) 40%, rgb(12 10 9 / 0.15) 100%)`,
              }}
            />
          ) : (
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/25" />
          )}
          <div className="relative flex min-h-[min(22rem,70vw)] flex-col justify-end p-6 sm:min-h-80 lg:p-10">
            <div className="flex max-w-3xl flex-col gap-6">
              <div className="flex flex-col gap-2 sm:gap-3">
                <h1
                  className={`wr-display max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl sm:leading-[1.04] lg:text-6xl lg:leading-[1.03] ${
                    palette
                      ? "text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_5%,rgb(255_253_249))]"
                      : "text-amber-50"
                  }`}
                >
                  {movie.title}
                </h1>
                {heroMetaLine ? (
                  <p
                    className={`text-sm font-semibold ${
                      palette
                        ? "text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_35%,rgb(254_246_229_/_0.92))]"
                        : "text-amber-200/90"
                    }`}
                  >
                    {heroMetaLine}
                  </p>
                ) : null}
              </div>
              {trimMeta(movie.metadata.tagline) ? (
                <p
                  className={`max-w-2xl text-base font-medium italic leading-relaxed sm:text-lg ${
                    palette
                      ? "text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_18%,rgb(255_251_246_/_0.96))]"
                      : "text-amber-100/95"
                  }`}
                >
                  &quot;{movie.metadata.tagline.trim()}&quot;
                </p>
              ) : null}
              <dl className="flex flex-wrap gap-3">
                <div
                  className={`border px-4 py-2.5 backdrop-blur-md ${
                    palette
                      ? "border-[color-mix(in_srgb,var(--movie-accent)_28%,transparent)] bg-[rgb(0_0_0/0.48)]"
                      : "border-white/22 bg-black/42"
                  }`}
                >
                  <dt
                    className={
                      palette
                        ? "text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_38%,rgb(254_244_229_/_0.85))]"
                        : "text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-200/78"
                    }
                  >
                    Sightings
                  </dt>
                  <dd
                    className={`wr-display mt-1 tabular-nums text-2xl font-bold leading-none tracking-tight sm:text-[1.625rem] ${
                      palette
                        ? "text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_6%,rgb(255_252_246))]"
                        : "text-amber-50"
                    }`}
                  >
                    {movieSightings.length}
                  </dd>
                </div>
                <div
                  className={`border px-4 py-2.5 backdrop-blur-md ${
                    palette
                      ? "border-[color-mix(in_srgb,var(--movie-accent)_28%,transparent)] bg-[rgb(0_0_0/0.48)]"
                      : "border-white/22 bg-black/42"
                  }`}
                >
                  <dt
                    className={
                      palette
                        ? "max-w-[10rem] text-[0.65rem] font-bold uppercase leading-snug tracking-[0.18em] text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_38%,rgb(254_244_229_/_0.85))]"
                        : "max-w-[10rem] text-[0.65rem] font-bold uppercase leading-snug tracking-[0.18em] text-amber-200/78"
                    }
                  >
                    Total rats
                  </dt>
                  <dd
                    className={`wr-display mt-1 tabular-nums text-2xl font-bold leading-none tracking-tight sm:text-[1.625rem] ${
                      palette
                        ? "text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_6%,rgb(255_252_246))]"
                        : "text-amber-50"
                    }`}
                  >
                    {approxRatsInMovie}
                  </dd>
                </div>
                {imdbRating ? (
                  <div
                    className={`border px-4 py-2.5 backdrop-blur-md ${
                      palette
                        ? "border-[color-mix(in_srgb,var(--movie-accent)_28%,transparent)] bg-[rgb(0_0_0/0.48)]"
                        : "border-white/22 bg-black/42"
                    }`}
                  >
                    <dt
                      className={
                        palette
                          ? "text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_38%,rgb(254_244_229_/_0.85))]"
                          : "text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-200/78"
                      }
                    >
                      IMDb rating
                    </dt>
                    <dd
                      className={`wr-display mt-1 flex items-baseline gap-1.5 tabular-nums text-2xl font-bold leading-none tracking-tight sm:text-[1.625rem] ${
                        palette
                          ? "text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_6%,rgb(255_252_246))]"
                          : "text-amber-50"
                      }`}
                    >
                      <span className="text-amber-400">★</span>
                      {imdbRating}
                      <span className="text-base font-normal opacity-60">/10</span>
                    </dd>
                  </div>
                ) : null}
              </dl>
              <a
                href={getImdbTitleUrl(movie.externalIds.imdb)}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex w-fit items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:brightness-[1.06] active:brightness-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  palette
                    ? "border border-transparent bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_50%,rgb(17_15_14_/_0.92))] text-[color-mix(in_srgb,var(--movie-accent,#ea580c)_4%,rgb(255_253_246))] focus-visible:outline-[color-mix(in_srgb,var(--movie-accent,#ea580c)_60%,rgb(251_191_36))]"
                    : "border-2 border-stone-950/90 bg-[rgb(253_224_71)] text-stone-950 dark:border-amber-200/40 focus-visible:outline-amber-400"
                }`}
              >
                Open on IMDb
              </a>
            </div>
          </div>
        </div>

        <MovieTabsShell
          palette={Boolean(palette)}
          tabs={[
            { id: "sightings", label: "Featured Rats" },
            ...(ratFacts.length > 0 ? [{ id: "rat-facts", label: "Rat Facts" }] : []),
            { id: "rat-views", label: "Reviews" },
            { id: "rat-media", label: "Media" },
            { id: "ratlated", label: "Related" },
          ]}
          sidebarContent={
            <>
              <Image
                src={movie.posterUrl}
                alt={movie.posterAlt}
                width={480}
                height={720}
                className={`aspect-[2/3] w-full max-w-[18rem] self-center shrink-0 rounded-xl object-cover ring-2 lg:max-w-full dark:ring-white/12 ${palette ? "ring-[color-mix(in_srgb,var(--movie-accent)_22%,transparent)]" : "ring-stone-950/10"}`}
              />
              <section className="space-y-2.5">
                <h2 className={sidebarSectionTitleClass}>Synopsis</h2>
                <p className="text-sm leading-[1.65] text-stone-800 dark:text-stone-200">
                  {movie.summary}
                </p>
              </section>
              <section className="space-y-3">
                <h2 className={sidebarSectionTitleClass}>Genres</h2>
                <ul className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <li key={genre}>
                      <span
                        className={`inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-semibold leading-none shadow-[1px_1px_0_0_rgb(28_25_23/0.12)] dark:shadow-[1px_1px_0_0_rgb(0_0_0/0.35)] ${
                          palette
                            ? "border-[color-mix(in_srgb,var(--movie-accent)_45%,rgb(120_113_108))] bg-[color-mix(in_srgb,var(--movie-column-wash)_88%,white)] text-stone-900 dark:border-amber-400/45 dark:bg-stone-900 dark:text-amber-100"
                            : "border-stone-400/65 bg-white text-stone-900 dark:border-amber-500/40 dark:bg-stone-800 dark:text-amber-100"
                        }`}
                      >
                        {genre}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              {hasDetailsSection ? (
                <section
                  className={`space-y-5 border-t pt-8 ${
                    palette
                      ? "border-[color-mix(in_srgb,var(--movie-accent)_26%,rgb(120_113_108/0.7))] dark:border-[color-mix(in_srgb,var(--movie-accent)_28%,rgb(245_240_232/0.24))]"
                      : "border-stone-900/18 dark:border-white/14"
                  }`}
                >
                  <h2 className={sidebarSectionTitleClass}>Details</h2>
                  <dl className="space-y-5 text-sm text-stone-800 dark:text-stone-100">
                    {runtimeLabel ? (
                      <div>
                        <dt className={sidebarDtClass}>Runtime</dt>
                        <dd className="mt-1 font-semibold">{runtimeLabel}</dd>
                      </div>
                    ) : null}
                    {certificate ? (
                      <div>
                        <dt className={sidebarDtClass}>Certificate</dt>
                        <dd className="mt-1 font-semibold">{certificate}</dd>
                      </div>
                    ) : null}
                    {imdbRating ? (
                      <div>
                        <dt className={sidebarDtClass}>IMDb score</dt>
                        <dd className="mt-1">
                          <a
                            href={imdbTitleUrlResolved}
                            target="_blank"
                            rel="noreferrer"
                            className="group font-semibold text-stone-900 underline decoration-stone-400 decoration-1 underline-offset-2 hover:decoration-amber-600 dark:text-amber-100 dark:decoration-amber-500/55 dark:hover:decoration-amber-400"
                          >
                            <span className="tabular-nums text-[1.06em] tracking-tight">
                              ★ {imdbRating}
                            </span>
                            <span className="font-medium text-stone-600 dark:text-stone-300">
                              /10
                            </span>
                            {imdbVotes ? (
                              <span className="font-normal text-stone-600 dark:text-stone-400">
                                {" "}
                                ({imdbVotes} votes)
                              </span>
                            ) : null}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {metascore ? (
                      <div>
                        <dt className={sidebarDtClass}>Metacritic</dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                          {metascore}/100 Metascore
                        </dd>
                      </div>
                    ) : null}
                    {writers ? (
                      <div>
                        <dt className={sidebarDtClass}>Writers</dt>
                        <dd className="mt-1 leading-snug">
                          <ImdbCreditsInline line={writers} />
                        </dd>
                      </div>
                    ) : null}
                    {director ? (
                      <div>
                        <dt className={sidebarDtClass}>Director</dt>
                        <dd className="mt-1 leading-snug">
                          <ImdbCreditsInline line={director} />
                        </dd>
                      </div>
                    ) : null}
                    {cast ? (
                      <div>
                        <dt className={sidebarDtClass}>Cast (top billed)</dt>
                        <dd className="mt-1 leading-relaxed">
                          <ImdbCreditsInline line={cast} />
                        </dd>
                      </div>
                    ) : null}
                    {originalLanguage ? (
                      <div>
                        <dt className={sidebarDtClass}>Language</dt>
                        <dd className="mt-1 font-medium">{originalLanguage}</dd>
                      </div>
                    ) : null}
                    {countriesLine ? (
                      <div>
                        <dt className={sidebarDtClass}>Countries</dt>
                        <dd className="mt-1 font-medium leading-snug">
                          {countriesLine}
                        </dd>
                      </div>
                    ) : null}
                    {awards ? (
                      <div>
                        <dt className={sidebarDtClass}>Honors</dt>
                        <dd className="mt-1 text-sm italic leading-snug text-stone-600 dark:text-stone-400">
                          {awards}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              ) : null}
            </>
          }
        >
          {/* Panel 0 — On-screen Rats */}
          <div>
            <header className={`mb-6 border-b pb-4 ${tabHeaderBorderClass(Boolean(palette))}`}>
              <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="wr-display shrink-0 text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
                  Featured Rats:
                </h2>
                {movieSightings.length > 0 ? (
                  <MovieSightingsSortControl
                    slug={slug}
                    sort={safeSort}
                    palette={Boolean(palette)}
                    isSeries={isSeriesTitle}
                  />
                ) : null}
              </div>
            </header>

            {movieSightings.length > 0 ? (
              <MovieSightingsPagingBar
                slug={slug}
                sort={safeSort}
                safePage={sightingsView.safePage}
                pageCount={sightingsView.pageCount}
                totalCount={sightingsView.totalCount}
                palette={Boolean(palette)}
              />
            ) : null}

            <div className="space-y-4">
              {movieSightings.length === 0 ? (
                <div
                  className={`mt-6 rounded-2xl border-2 border-dashed px-6 py-14 text-center dark:border-white/18 ${
                    palette
                      ? "border-[color-mix(in_srgb,var(--movie-accent)_25%,rgb(214_211_209))] bg-[color-mix(in_srgb,var(--movie-column-wash)_55%,white)] dark:bg-[rgb(34_29_25/0.65)]"
                      : "border-stone-900/25 bg-[var(--wr-surface-cream-soft)]/80 dark:bg-stone-900/40"
                  }`}
                >
                  <p className="wr-display text-lg font-bold text-stone-800 dark:text-stone-100">
                    No sightings yet for this title.
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-600 dark:text-stone-400">
                    Catalog curators haven&apos;t published rat cameos here. Check
                    back after the queue catches up—or submit what you spotted.
                  </p>
                  <Link
                    href={`/submit?for=${encodeURIComponent(movie.externalIds.imdb)}&title=${encodeURIComponent(movie.title)}&year=${encodeURIComponent(String(movie.releaseYear))}&poster=${encodeURIComponent(movie.posterUrl)}`}
                    className="mt-6 inline-flex wr-btn-primary"
                  >
                    Submit a sighting
                  </Link>
                </div>
              ) : null}

              {movieSightings.length > 0 ? (
                <MovieSightingsCards
                  items={pageSlice}
                  palette={Boolean(palette)}
                  spoilerCountMovie={movieSpoilerCount}
                  canEditSightings={canEditSightings}
                  editBasePath={sightingsBasePath}
                  isSeries={isSeriesTitle}
                />
              ) : null}
            </div>

            {movieSightings.length > 0 ? (
              <MovieSightingsPagingBar
                slug={slug}
                sort={safeSort}
                safePage={sightingsView.safePage}
                pageCount={sightingsView.pageCount}
                totalCount={sightingsView.totalCount}
                palette={Boolean(palette)}
                placement="bottom"
              />
            ) : null}
          </div>

          {/* Panel 1 — Rat Facts (conditional, must match tab condition) */}
          {ratFacts.length > 0 ? (
            <div>
              <header className={`mb-6 border-b pb-4 ${tabHeaderBorderClass(Boolean(palette))}`}>
                <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="wr-display text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
                    Rat Facts:
                  </h2>
                  <ImdbLinkButton
                    href={`https://www.imdb.com/title/${movie.externalIds.imdb}/trivia/`}
                    label="All trivia on IMDb"
                  />
                </div>
              </header>
              <div className="space-y-4">
                {ratFacts.map((fact, i) => (
                  <div key={i} className={tabCardClass(Boolean(palette))}>
                    <p className="wr-display mb-3 text-base font-black uppercase tracking-widest text-stone-600 dark:text-stone-300">
                      Rat Fact #{i + 1}
                    </p>
                    <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                      {fact}
                    </p>
                    <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
                      Source: IMDb trivia
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Panel 2 — Reviews */}
          <MovieRatviewsTab
            reviews={imdbReviews}
            imdbId={movie.externalIds.imdb}
            palette={Boolean(palette)}
          />

          {/* Panel 3 — Media */}
          <MovieRatMediaTab
            videos={imdbVideos}
            images={imdbImages}
            imdbId={movie.externalIds.imdb}
            palette={Boolean(palette)}
          />

          {/* Panel 4 — Related */}
          <MovieRatlatedTab
            titles={imdbRelated}
            imdbId={movie.externalIds.imdb}
            palette={Boolean(palette)}
          />
        </MovieTabsShell>
      </section>

      {editMovie && canEditMovie ? (
        <div className="fixed inset-0 z-[220] flex items-start justify-center bg-black/55 px-4 py-8 sm:py-12">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-stone-950/90 bg-[var(--wr-surface-cream)] p-6 shadow-[0_20px_60px_rgb(0_0_0/0.45)] dark:border-white/14 dark:bg-stone-900/95 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-stone-950 dark:text-stone-100">
                  {movie.title}
                </h2>
              </div>
              <Link
                href={`/movies/${slug}`}
                className="rounded-lg border border-stone-900/25 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/18 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Close
              </Link>
            </div>

            <form action={updateMovieInfo} className="mt-6 grid gap-4">
              <input type="hidden" name="slug" value={slug} />
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Title
                <input name="title" required defaultValue={movie.title} className="wr-input" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Release year
                  <input name="releaseYear" type="number" defaultValue={movie.releaseYear} className="wr-input" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Runtime (minutes)
                  <input name="runtimeMinutes" type="number" defaultValue={movie.runtimeMinutes} className="wr-input" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Dark wash
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteWashDark"
                      type="color"
                      defaultValue={manualPaletteDark?.wash ?? visuals.syncedPaletteDark?.wash ?? "#110e0c"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPaletteDark?.wash ?? visuals.syncedPaletteDark?.wash ?? "#110e0c"}
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Dark column wash
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteColumnWashDark"
                      type="color"
                      defaultValue={manualPaletteDark?.columnWash ?? visuals.syncedPaletteDark?.columnWash ?? "#0c0a09"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPaletteDark?.columnWash ?? visuals.syncedPaletteDark?.columnWash ?? "#0c0a09"}
                    </span>
                  </div>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Dark accent
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteAccentDark"
                      type="color"
                      defaultValue={manualPaletteDark?.accent ?? visuals.syncedPaletteDark?.accent ?? "#a16207"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPaletteDark?.accent ?? visuals.syncedPaletteDark?.accent ?? "#a16207"}
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Dark hero bloom
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteHeroBloomDark"
                      type="color"
                      defaultValue={manualPaletteDark?.heroBloom ?? visuals.syncedPaletteDark?.heroBloom ?? "#080706"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPaletteDark?.heroBloom ?? visuals.syncedPaletteDark?.heroBloom ?? "#080706"}
                    </span>
                  </div>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Genres (comma-separated)
                <input name="genres" defaultValue={movie.genres.join(", ")} className="wr-input" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Summary
                <textarea name="summary" rows={4} defaultValue={movie.summary} className="wr-input" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Poster image URL
                <input name="posterUrl" defaultValue={movie.posterUrl} className="wr-input" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Current hero banner URL
                <input value={visuals.bannerUrl} readOnly className="wr-input opacity-80" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Palette wash
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteWash"
                      type="color"
                      defaultValue={manualPalette?.wash ?? visuals.syncedPalette?.wash ?? "#fffbeb"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPalette?.wash ?? visuals.syncedPalette?.wash ?? "#fffbeb"}
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Palette column wash
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteColumnWash"
                      type="color"
                      defaultValue={manualPalette?.columnWash ?? visuals.syncedPalette?.columnWash ?? "#fffdf6"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPalette?.columnWash ?? visuals.syncedPalette?.columnWash ?? "#fffdf6"}
                    </span>
                  </div>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Palette accent
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteAccent"
                      type="color"
                      defaultValue={manualPalette?.accent ?? visuals.syncedPalette?.accent ?? "#b45309"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPalette?.accent ?? visuals.syncedPalette?.accent ?? "#b45309"}
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Palette hero bloom
                  <div className="flex items-center gap-2">
                    <input
                      name="paletteHeroBloom"
                      type="color"
                      defaultValue={manualPalette?.heroBloom ?? visuals.syncedPalette?.heroBloom ?? "#2b2118"}
                      className="h-10 w-14 cursor-pointer rounded border border-stone-300 bg-transparent p-1 dark:border-stone-700"
                    />
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {manualPalette?.heroBloom ?? visuals.syncedPalette?.heroBloom ?? "#2b2118"}
                    </span>
                  </div>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Tagline
                <input name="tagline" defaultValue={movie.metadata.tagline} className="wr-input" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Certificate
                  <input name="rating" defaultValue={movie.metadata.rating} className="wr-input" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Director
                  <input name="director" defaultValue={movie.metadata.director} className="wr-input" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Writers
                  <input name="writers" defaultValue={movie.metadata.writers} className="wr-input" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Cast
                  <input name="cast" defaultValue={movie.metadata.cast} className="wr-input" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  IMDb score
                  <input name="imdbRating" defaultValue={movie.metadata.imdbRating} className="wr-input" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  IMDb votes
                  <input name="imdbVotes" defaultValue={movie.metadata.imdbVotes} className="wr-input" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Metascore
                  <input name="metascore" defaultValue={movie.metadata.metascore} className="wr-input" />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Awards / honors
                <input name="awards" defaultValue={movie.metadata.awards} className="wr-input" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Language
                  <input name="originalLanguage" defaultValue={movie.metadata.originalLanguage} className="wr-input" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                  Countries (comma-separated)
                  <input name="countries" defaultValue={movie.metadata.productionCountries.join(", ")} className="wr-input" />
                </label>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/movies/${slug}`}
                  className="wr-btn bg-white text-stone-900 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="wr-btn-primary"
                >
                  Save movie info
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {editingSighting && canEditSightings ? (
        <div className="fixed inset-0 z-[220] flex items-start justify-center bg-black/55 px-4 py-8 sm:py-12">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-stone-950/90 bg-[var(--wr-surface-cream)] p-6 shadow-[0_20px_60px_rgb(0_0_0/0.45)] dark:border-white/14 dark:bg-stone-900/95 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-stone-950 dark:text-stone-100">
                  {editingSighting.title}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {movie.title}
                </p>
              </div>
              <Link
                href={sightingsBasePath}
                className="rounded-lg border border-stone-900/25 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/18 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                Close
              </Link>
            </div>

            <form action={updateSightingInfo} className="mt-6 grid gap-4">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="sightingId" value={editingSighting.id} />
              <input type="hidden" name="returnTo" value={sightingsBasePath} />
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Sighting title
                <input name="title" required defaultValue={editingSighting.title} className="wr-input" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Approx. point in movie
                <input
                  name="timestamp"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={getSightingTimestampPercent(editingSighting.timestamp) ?? 50}
                  className="accent-amber-700 dark:accent-amber-400"
                />
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Stored as a percentage into the {isSeriesTitle ? "episode" : "movie"}.
                </p>
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Approx. rats
                <input
                  name="approximateRatCount"
                  type="number"
                  min={1}
                  max={999}
                  required
                  defaultValue={editingSighting.approximateRatCount}
                  className="wr-input tabular-nums"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Description
                <textarea
                  name="description"
                  rows={4}
                  required
                  defaultValue={editingSighting.description}
                  className="wr-input h-auto min-h-24 resize-y py-3 leading-relaxed"
                />
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Markdown is supported (bold, lists, links, headings). It renders on movie pages.
                </span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                Curator message
                <textarea
                  name="curatorNote"
                  rows={3}
                  defaultValue={editingSighting.curatorNote ?? ""}
                  placeholder="Optional note shown with the published sighting."
                  className="wr-input h-auto min-h-24 resize-y py-3 leading-relaxed"
                />
              </label>
              <EditableSightingImagesField initialImages={editingSightingImages} />
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-900/12 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-white/10 dark:bg-stone-900/50 dark:text-stone-100 dark:hover:bg-white/5">
                <span>Contains spoilers</span>
                <span className="relative inline-flex shrink-0 items-center">
                  <input
                    name="spoiler"
                    type="checkbox"
                    defaultChecked={editingSighting.spoiler}
                    className="peer sr-only"
                  />
                  <span className="block h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-amber-500 dark:bg-stone-600 dark:peer-checked:bg-amber-500" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <ConfirmSubmitButton
                  confirmMessage="Delete this sighting? This cannot be undone."
                  type="submit"
                  formAction={deleteSighting}
                  className="wr-btn bg-red-100 text-red-900 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-100"
                >
                  Delete sighting
                </ConfirmSubmitButton>
                <Link
                  href={sightingsBasePath}
                  className="wr-btn bg-white text-stone-900 dark:border-white/18 dark:bg-stone-800 dark:text-stone-100"
                >
                  Cancel
                </Link>
                <button type="submit" className="wr-btn-primary">
                  Save sighting
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
