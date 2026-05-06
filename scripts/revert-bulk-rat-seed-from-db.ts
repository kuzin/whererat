/**
 * Remove TMDB bulk rat-keyword inserts from Postgres (live-safe: no truncation).
 *
 * Deletes sightings whose id begins with bulk-rat- (cascades sighting_images,
 * sighting_overrides), then deletes movies that were only from that import
 * (metadataProvider = TMDB keyword seed) and have no remaining active sightings.
 *
 * Usage: NODE_ENV=production DATABASE_URL=... npx tsx scripts/revert-bulk-rat-seed-from-db.ts
 * Add --dry-run to roll back after reporting counts.
 */
import "./load-env";
import { closeDbPool, getDbPool } from "@/lib/db";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exitCode = 1;
    return;
  }

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    const sightingRes = await client.query<{ id: string }>(
      `delete from sightings
       where id like 'bulk-rat-%'
       returning id`,
    );

    const movieRes = await client.query<{ id: string }>(
      `delete from movies m
       where coalesce(metadata->>'metadataProvider', '') = 'TMDB keyword seed'
         and m.is_deleted = false
         and not exists (
           select 1 from sightings s
           where s.movie_id = m.id and not s.is_deleted
         )
       returning m.id`,
    );

    console.log(
      `Removed ${sightingRes.rowCount ?? 0} bulk sightings (${sightingRes.rows.length} rows returned).`,
    );
    console.log(
      `Removed ${movieRes.rowCount ?? 0} orphan TMDB-keyword-seed movies (${movieRes.rows.length} rows returned).`,
    );

    if (dryRun) {
      await client.query("rollback");
      console.log("Dry-run: rolled back.");
    } else {
      await client.query("commit");
      console.log("Committed.");
    }
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
    await closeDbPool();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
