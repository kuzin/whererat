import "./load-env";
import { closeDbPool, getDbPool } from "@/lib/db";

const MOVIE_COUNT = 30;
const MIN_SIGHTINGS_PER_MOVIE = 8;
const MAX_SIGHTINGS_PER_MOVIE = 14;

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Sci-Fi",
  "Thriller",
];

const PROMINENCE = ["blink-and-miss", "background", "scene-stealer"] as const;
const SCENE_TYPES = ["live-action", "animated", "symbolic", "swarm", "final-shot"] as const;
const CONFIDENCE = ["needs-source", "likely", "verified"] as const;
const RAT_BEHAVIORS = [
  "darting across the hallway",
  "peeking from a crate",
  "rushing past the foreground",
  "climbing along pipes",
  "lurking near a doorway",
  "crossing behind the lead actor",
  "scattering from a food cart",
  "hiding under a table",
  "running along a ledge",
  "appearing in the lower-right corner",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

function sampleGenres() {
  const count = randInt(1, 3);
  const shuffled = [...GENRES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function makeImdbId(n: number) {
  // "tt" + 7 digits; unique for this temp batch.
  return `tt${String(9000000 + n).padStart(7, "0")}`;
}

async function main() {
  const pool = getDbPool();
  const client = await pool.connect();
  const batchTag = `temp-livefill-${Date.now()}`;
  let insertedMovies = 0;
  let insertedSightings = 0;

  try {
    await client.query("begin");

    for (let i = 1; i <= MOVIE_COUNT; i++) {
      const movieId = `${batchTag}-movie-${i}`;
      const slug = `${batchTag}-movie-${i}`;
      const title = `Temp Catalog Movie ${i}`;
      const releaseYear = randInt(1978, 2025);
      const runtime = randInt(82, 172);
      const imdbId = makeImdbId(i);
      const genres = sampleGenres();
      const posterTone = pick(["rat-brown", "ember", "moody-blue", "neon", "slate"]);
      const summary = `Temporary catalog fill item ${i}. Added for visual density and QA of list, detail, and moderation surfaces.`;
      const metadata = {
        rating: pick(["PG-13", "R", "PG", "TV-14", "Not Rated"]),
        imdbRating: `${randInt(52, 89) / 10}`,
        imdbVotes: `${randInt(2, 120)}k`,
        ratFacts: [
          "Temporary QA fact entry.",
          "Will be removed before production cutover.",
        ],
      };

      await client.query(
        `insert into movies
          (id, slug, title, release_year, runtime_minutes, genres, poster_tone, poster_url, backdrop_url, poster_alt, imdb_id, tmdb_id, summary, metadata)
         values
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,null,$12,$13::jsonb)`,
        [
          movieId,
          slug,
          title,
          releaseYear,
          runtime,
          genres,
          posterTone,
          `https://placehold.co/600x900/292524/fef3c7/png?text=${encodeURIComponent(title)}`,
          `https://placehold.co/1200x600/292524/fef3c7/png?text=${encodeURIComponent(title)}`,
          `${title} temporary poster`,
          imdbId,
          summary,
          JSON.stringify(metadata),
        ],
      );
      insertedMovies += 1;

      const sightingCount = randInt(MIN_SIGHTINGS_PER_MOVIE, MAX_SIGHTINGS_PER_MOVIE);
      for (let j = 1; j <= sightingCount; j++) {
        const sightingId = `${batchTag}-sighting-${i}-${j}`;
        const timestampPct = randInt(1, 99);
        const ratCount = randInt(1, 18);
        const spoiler = Math.random() < 0.22;
        const behavior = pick(RAT_BEHAVIORS);

        await client.query(
          `insert into sightings
            (id, movie_id, timestamp_code, title, description, prominence, scene_type, spoiler, confidence, verification_state, verified_by, source_ids, curator_note, approximate_rat_count, submitter_name, submission_reviewed_at)
           values
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,'verified',$10,$11,$12,$13,$14,now())`,
          [
            sightingId,
            movieId,
            `${timestampPct}%`,
            `Temp sighting ${j}`,
            `At about ${timestampPct}% into the runtime, a rat is seen ${behavior}. Temporary QA content for layout validation.`,
            pick(PROMINENCE),
            pick(SCENE_TYPES),
            spoiler,
            pick(CONFIDENCE),
            "QA Moderator",
            ["temp-data", "manual-fill"],
            "Temporary entry for UI density checks.",
            ratCount,
            "QA Tester",
          ],
        );
        insertedSightings += 1;
      }
    }

    await client.query("commit");
    console.log(
      `Added temp content: ${insertedMovies} movies, ${insertedSightings} sightings (tag: ${batchTag}).`,
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

