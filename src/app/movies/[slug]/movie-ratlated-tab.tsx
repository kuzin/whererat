import type { ImdbRelatedTitle } from "@/lib/whererat";
import { tabCardColors, tabHeaderBorderClass, tabMediaCardClass } from "./movie-tab-classes";

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

          <img
            src={imdbPosterThumb(title.posterUrl)}
            alt={`${title.title} poster`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <img src="/openmoji/color/svg/1F3AC.svg" alt="" width={36} height={36} className="opacity-30" aria-hidden />
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
  palette: boolean;
};

export function MovieRatlatedTab({ titles, palette }: Props) {
  const headerBorder = tabHeaderBorderClass(palette);

  return (
    <div>
      <header className={`mb-6 border-b pb-4 ${headerBorder}`}>
        <div className="flex min-h-12 items-center">
          <h2 className="wr-display text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
            Related
          </h2>
        </div>
      </header>

      {titles.length === 0 ? (
        <div className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center ${tabCardColors(palette)}`}>
          <img src="/openmoji/color/svg/1F39E.svg" alt="" width={40} height={40} className="mx-auto" aria-hidden />
          <p className="wr-display mt-4 text-lg font-bold text-stone-800 dark:text-stone-100">
            No related titles yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600 dark:text-stone-400">
            Resync to fetch recommendations from IMDb.
          </p>
        </div>
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
