import "./load-env";
import { closeDbPool, getDbPool } from "@/lib/db";

async function main() {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query("begin");

    // Keep `accounts`; clear all seeded/app content.
    await client.query("truncate table review_actions restart identity cascade");
    await client.query("truncate table submission_images restart identity cascade");
    await client.query("truncate table submissions restart identity cascade");
    await client.query("truncate table sighting_images restart identity cascade");
    await client.query("truncate table sighting_overrides restart identity cascade");
    await client.query("truncate table movie_overrides restart identity cascade");
    await client.query("truncate table sightings restart identity cascade");
    await client.query("truncate table movies restart identity cascade");

    await client.query("commit");

    const counts = await client.query<{
      accounts: string;
      movies: string;
      sightings: string;
      submissions: string;
      review_actions: string;
    }>(
      `select
         (select count(*)::text from accounts) as accounts,
         (select count(*)::text from movies) as movies,
         (select count(*)::text from sightings) as sightings,
         (select count(*)::text from submissions) as submissions,
         (select count(*)::text from review_actions) as review_actions`,
    );
    const row = counts.rows[0];
    console.log("DB content cleared (accounts preserved).");
    console.log(
      `accounts=${row?.accounts ?? "?"}, movies=${row?.movies ?? "?"}, sightings=${row?.sightings ?? "?"}, submissions=${row?.submissions ?? "?"}, review_actions=${row?.review_actions ?? "?"}`,
    );
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
