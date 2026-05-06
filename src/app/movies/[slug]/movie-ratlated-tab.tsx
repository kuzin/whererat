import type { ImdbRelatedTitle } from "@/lib/whererat";
import { tabHeaderBorderClass, tabMediaCardClass } from "./movie-tab-classes";

function formatRating(rating: number) {
  return rating.toFixed(1);
}

function RelatedCard({
  title,
  palette,
}: {
  title: ImdbRelatedTitle;
  palette: boolean;
}) {
  const imdbUrl = `https://www.imdb.com/title/${title.id}/`;
  const cardBase = `${tabMediaCardClass(palette)} transition-shadow hover:shadow-md`;

  return (
    <a
      href={imdbUrl}
      target="_blank"
      rel="noreferrer"
      className={`group flex flex-col no-underline ${cardBase}`}
      aria-label={`${title.title}${title.year ? ` (${title.year})` : ""} on IMDb`}
    >
      {/* Poster */}
      <div className="aspect-[2/3] w-full overflow-hidden bg-stone-200 dark:bg-stone-800">
        {title.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imdbPosterThumb(title.posterUrl)}
            alt={`${title.title} poster`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl opacity-30" aria-hidden>🎬</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-stone-900 dark:text-stone-100 group-hover:underline">
          {title.title}
        </p>
        <div className="mt-auto flex items-center justify-between gap-1 pt-0.5">
          {title.year ? (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {title.year}
            </span>
          ) : (
            <span />
          )}
          {title.rating != null ? (
            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span aria-hidden>★</span>
              {formatRating(title.rating)}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

/**
 * Resize an IMDb image URL to a small poster thumbnail (~185px wide).
 * IMDb uses Amazon CloudFront URLs with a `._V1_` token we can inject size hints into.
 */
function imdbPosterThumb(url: string): string {
  // Replace everything after ._V1_ (or append before the file extension) with a
  // standard thumbnail spec. The `UX185` token means "max width 185px".
  return url.replace(/\._V1_.*?(\.\w+)$/, "._V1_UX260$1");
}

type Props = {
  titles: ImdbRelatedTitle[];
  imdbId: string;
  palette: boolean;
};

export function MovieRatlatedTab({ titles, imdbId, palette }: Props) {
  const headerBorder = tabHeaderBorderClass(palette);

  return (
    <div>
      <header className={`mb-6 border-b pb-4 ${headerBorder}`}>
        <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="wr-display text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
            Related:
          </h2>
          <a
            href={`https://www.imdb.com/title/${imdbId}/recommendations/`}
            target="_blank"
            rel="noreferrer"
            title="More recommendations on IMDb"
            aria-label="More recommendations on IMDb"
            className="wr-btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold"
          >
            View on IMDb
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
              <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
              <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
            </svg>
          </a>
        </div>
      </header>

      {titles.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
          No related titles synced yet. Hit <strong>Resync</strong> to pull from IMDb.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {titles.map((title) => (
            <li key={title.id}>
              <RelatedCard title={title} palette={palette} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
