import { readFile } from "node:fs/promises";
import path from "node:path";
import "./load-env";
import type { PostgresSeed } from "@/lib/postgres-seed";
import { closeDbPool, getDbPool } from "@/lib/db";

async function main() {
  const seedPath = path.join(process.cwd(), "db", "seed.json");
  const raw = await readFile(seedPath, "utf8");
  const seed = JSON.parse(raw) as PostgresSeed;
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query("begin");

    // Reseed deterministically for dev/staging environments.
    await client.query("truncate table sighting_overrides restart identity cascade");
    await client.query("truncate table movie_overrides restart identity cascade");
    await client.query("truncate table review_actions restart identity cascade");
    await client.query("truncate table submission_images restart identity cascade");
    await client.query("truncate table submissions restart identity cascade");
    await client.query("truncate table sighting_images restart identity cascade");
    await client.query("truncate table sightings restart identity cascade");
    await client.query("truncate table movies restart identity cascade");
    await client.query("truncate table accounts restart identity cascade");

    for (const row of seed.accounts) {
      await client.query(
        `insert into accounts
          (id, username, display_name, email, avatar_url, role, password_hash)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          row.id,
          row.username,
          row.display_name,
          row.email,
          row.avatar_url,
          row.role,
          row.password_hash,
        ],
      );
    }

    for (const row of seed.movies) {
      await client.query(
        `insert into movies
          (id, slug, title, release_year, runtime_minutes, genres, poster_tone, poster_url, backdrop_url, poster_alt, imdb_id, tmdb_id, summary, metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          row.id,
          row.slug,
          row.title,
          row.release_year,
          row.runtime_minutes,
          row.genres,
          row.poster_tone,
          row.poster_url,
          row.backdrop_url,
          row.poster_alt,
          row.imdb_id,
          row.tmdb_id ?? null,
          row.summary,
          row.metadata,
        ],
      );
    }

    for (const row of seed.sightings) {
      await client.query(
        `insert into sightings
          (id, movie_id, timestamp_code, title, description, prominence, scene_type, spoiler, confidence, verification_state, verified_by, source_ids, curator_note, approximate_rat_count, submitter_name, submission_reviewed_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          row.id,
          row.movie_id,
          row.timestamp_code,
          row.title ?? null,
          row.description,
          row.prominence,
          row.scene_type,
          row.spoiler,
          row.confidence,
          row.verification_state,
          row.verified_by,
          row.source_ids,
          row.curator_note ?? null,
          row.approximate_rat_count ?? null,
          row.submitter_name ?? null,
          row.submission_reviewed_at ?? null,
        ],
      );
    }

    for (const row of seed.sighting_images) {
      await client.query(
        `insert into sighting_images
          (sighting_id, image_url, image_alt, sort_order)
         values ($1,$2,$3,$4)`,
        [row.sighting_id, row.image_url, row.image_alt ?? null, row.sort_order],
      );
    }

    for (const row of seed.submissions) {
      await client.query(
        `insert into submissions
          (id, movie_title, movie_year, imdb_id, timestamp_code, title, description, spoiler, approximate_rat_count, status, submitted_by, submitter_email, curator_note, duplicate_hint, movie_poster_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          row.id,
          row.movie_title,
          row.movie_year ?? null,
          row.imdb_id ?? null,
          row.timestamp_code,
          row.title ?? null,
          row.description,
          row.spoiler,
          row.approximate_rat_count,
          row.status,
          row.submitted_by,
          row.submitter_email ?? null,
          row.curator_note ?? null,
          row.duplicate_hint ?? null,
          row.movie_poster_url ?? null,
        ],
      );
    }

    for (const row of seed.submission_images) {
      await client.query(
        `insert into submission_images
          (submission_id, image_url, image_alt, sort_order)
         values ($1,$2,$3,$4)`,
        [row.submission_id, row.image_url, row.image_alt ?? null, row.sort_order],
      );
    }

    for (const row of seed.review_actions) {
      await client.query(
        `insert into review_actions
          (id, submission_id, movie_title, action, moderator_id, moderator_name, reviewed_at, note)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          row.id,
          row.submission_id,
          row.movie_title,
          row.action,
          row.moderator_id,
          row.moderator_name,
          row.reviewed_at,
          row.note,
        ],
      );
    }

    await client.query("commit");
    console.log("Seeded Postgres database from db/seed.json");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await closeDbPool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
