/**
 * Full-catalog OMDb + IMDb GraphQL sync (posters, plot, rat trivia, related, media).
 * Uses same pipeline as moderation "Resync all movies" and `/api/cron/imdb-resync`.
 *
 * Requires DATABASE_URL. Set OMDB_API_KEY in `.env.local` for OMDb-backed fields.
 */
import "./load-env";
import { closeDbPool } from "@/lib/db";
import { resyncAllCatalogMoviesFromImdb } from "@/lib/movie-imdb-sync";

async function main() {
  if (!process.env.OMDB_API_KEY?.trim()) {
    console.warn(
      "OMDB_API_KEY is unset — OMDb plot/posters/credits will be skipped; IMDb GraphQL may still update.",
    );
  }
  const result = await resyncAllCatalogMoviesFromImdb();
  console.log(
    `IMDb/OMDb sync: total=${result.total} synced=${result.synced} errors=${result.errors} truncated=${result.truncated}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDbPool());
