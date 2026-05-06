/**
 * Insert TMDB bulk rat-keyword movies + sightings into a live Postgres DB
 * without truncating anything. Safe to run multiple times (skips duplicates).
 *
 * Requires DATABASE_URL. Optional: NODE_ENV=production for SSL toward Neon.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import "./load-env";
import { closeDbPool, getDbPool } from "@/lib/db";

type BulkMovieJson = {
  id: string;
  slug: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  genres: string[];
  posterTone: string;
  posterUrl: string;
  backdropUrl: string;
  posterAlt: string;
  externalIds: { tmdb?: string; imdb: string };
  metadata: Record<string, unknown>;
  summary: string;
};

type BulkSightingJson = {
  id: string;
  movieId: string;
  timestamp: string;
  title?: string;
  description: string;
  prominence: string;
  sceneType: string;
  spoiler: boolean;
  confidence: string;
  verificationState: string;
  verifiedBy: string;
  sourceIds: string[];
  approximateRatCount?: number;
  curatorNote?: string;
  submitterName?: string;
  submissionReviewedAt?: string;
  imageUrl?: string;
  imageAlt?: string;
  images?: { url: string; alt?: string }[];
};

type BulkFile = {
  movies: BulkMovieJson[];
  sightings: BulkSightingJson[];
};

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }
  return url;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  requireDatabaseUrl();

  const seedPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "generated",
    "bulk-rat-seed.json",
  );
  const raw = await readFile(seedPath, "utf8");
  const bulk = JSON.parse(raw) as BulkFile;

  const pool = getDbPool();
  const client = await pool.connect();

  const existingMovieMeta = await client.query<{
    id: string;
    slug: string;
    imdb_id: string;
  }>(
    `select id, slug, imdb_id from movies where is_deleted = false`,
  );

  const existingImdb = new Set(
    existingMovieMeta.rows.map((r) => r.imdb_id.toLowerCase()),
  );
  const usedSlugs = new Set(
    existingMovieMeta.rows.map((r) => r.slug.toLowerCase()),
  );
  const usedIds = new Set(existingMovieMeta.rows.map((r) => r.id));

  const idRemap = new Map<string, string>();
  const moviesToInsert: Array<{
    originalId: string;
    id: string;
    slug: string;
    row: BulkMovieJson;
  }> = [];

  for (const row of bulk.movies) {
    const imdb = row.externalIds?.imdb?.trim().toLowerCase();
    if (!imdb) continue;
    if (existingImdb.has(imdb)) continue;

    const origId = row.id;
    const origSlug = row.slug;
    let id = origId;
    let slug = origSlug;

    while (usedSlugs.has(slug.toLowerCase()) || usedIds.has(id)) {
      slug = `${slug}-ratkw`;
      id = slug;
    }

    usedSlugs.add(slug.toLowerCase());
    usedIds.add(id);
    existingImdb.add(imdb);

    idRemap.set(origId, id);
    moviesToInsert.push({ originalId: origId, id, slug, row });
  }

  const plannedSightingCount = bulk.sightings.filter((s) => {
    const mid = idRemap.get(s.movieId) ?? s.movieId;
    return moviesToInsert.some((m) => m.id === mid);
  }).length;

  console.log(
    [
      `Bulk file: ${bulk.movies.length} movies, ${bulk.sightings.length} sightings.`,
      `Plan: attempt ${moviesToInsert.length} new movies (by IMDb not in DB); up to ${plannedSightingCount} matching sightings with images.`,
      dryRun ? "(dry-run: rolling back)" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );

  let moviesInserted = 0;
  let sightingsInserted = 0;
  let imagesInserted = 0;

  try {
    await client.query("begin");

    const moviesActuallyInserted = new Set<string>();

    for (const { id, slug, row } of moviesToInsert) {
      const res = await client.query<{ id: string }>(
        `insert into movies
          (id, slug, title, release_year, runtime_minutes, genres, poster_tone, poster_url, backdrop_url, poster_alt, imdb_id, tmdb_id, summary, metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
         on conflict (imdb_id) do nothing
         returning id`,
        [
          id,
          slug,
          row.title,
          row.releaseYear,
          row.runtimeMinutes,
          row.genres,
          row.posterTone,
          row.posterUrl,
          row.backdropUrl,
          row.posterAlt,
          row.externalIds.imdb,
          row.externalIds.tmdb ?? null,
          row.summary,
          JSON.stringify(row.metadata ?? {}),
        ],
      );
      if (res.rows[0]?.id) {
        moviesInserted += 1;
        moviesActuallyInserted.add(res.rows[0].id);
      }
    }

    const sightingsToInsert = bulk.sightings
      .map((s) => {
        const movieId = idRemap.get(s.movieId) ?? s.movieId;
        return { ...s, movieId };
      })
      .filter((s) => moviesActuallyInserted.has(s.movieId));

    for (const s of sightingsToInsert) {
      const imgSlots: { url: string; alt?: string }[] =
        Array.isArray(s.images) && s.images.length ? [...s.images] : [];
      const legacyUrl = s.imageUrl?.trim();
      if (legacyUrl) {
        const dup = imgSlots.some((x) => x.url === legacyUrl);
        if (!dup)
          imgSlots.push({ url: legacyUrl, alt: s.imageAlt ?? undefined });
      }

      const res = await client.query(
        `insert into sightings
          (id, movie_id, timestamp_code, title, description, prominence, scene_type, spoiler, confidence, verification_state, verified_by, source_ids, curator_note, approximate_rat_count, submitter_name, submission_reviewed_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         on conflict (id) do nothing
         returning id`,
        [
          s.id,
          s.movieId,
          s.timestamp,
          s.title ?? null,
          s.description,
          s.prominence,
          s.sceneType,
          s.spoiler,
          s.confidence,
          s.verificationState,
          s.verifiedBy,
          s.sourceIds,
          s.curatorNote ?? null,
          s.approximateRatCount ?? null,
          s.submitterName ?? null,
          s.submissionReviewedAt ?? null,
        ],
      );
      if ((res.rowCount ?? 0) === 0) continue;
      sightingsInserted += 1;

      for (const [sortOrder, slot] of imgSlots.entries()) {
        const ir = await client.query(
          `insert into sighting_images (sighting_id, image_url, image_alt, sort_order)
           values ($1,$2,$3,$4)
           on conflict (sighting_id, sort_order) do nothing`,
          [s.id, slot.url, slot.alt ?? null, sortOrder],
        );
        imagesInserted += ir.rowCount ?? 0;
      }
    }

    if (dryRun) {
      await client.query("rollback");
      console.log("Dry-run complete (rolled back).");
    } else {
      await client.query("commit");
      console.log(
        `Done. Inserted movies: ${moviesInserted}, sightings: ${sightingsInserted}, sighting_images rows: ${imagesInserted}.`,
      );
    }
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
    await closeDbPool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
