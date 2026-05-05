import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { closeDbPool, getDbPool } from "@/lib/db";
import "./load-env";

type UrlRef = {
  table: "accounts" | "movies" | "submissions" | "sighting_images" | "submission_images";
  column: string;
  id: string;
  url: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function getPublicBaseUrl() {
  const custom = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (custom) return custom.replace(/\/+$/, "");
  const bucket = requireEnv("S3_BUCKET_NAME");
  const region = requireEnv("AWS_REGION");
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

function isLocalUploadUrl(value: string) {
  return value.startsWith("/uploads/");
}

function contentTypeForKey(key: string) {
  const lowered = key.toLowerCase();
  if (lowered.endsWith(".png")) return "image/png";
  if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "image/jpeg";
  if (lowered.endsWith(".webp")) return "image/webp";
  if (lowered.endsWith(".gif")) return "image/gif";
  if (lowered.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function collectUrlRefs() {
  const pool = getDbPool();
  const refs: UrlRef[] = [];

  const [accounts, movies, submissions, sightingImages, submissionImages] = await Promise.all([
    pool.query<{ id: string; avatar_url: string }>(`select id, avatar_url from accounts`),
    pool.query<{ id: string; poster_url: string; backdrop_url: string }>(
      `select id, poster_url, backdrop_url from movies`,
    ),
    pool.query<{ id: string; movie_poster_url: string | null }>(
      `select id, movie_poster_url from submissions where movie_poster_url is not null`,
    ),
    pool.query<{ id: string; image_url: string }>(`select id, image_url from sighting_images`),
    pool.query<{ id: string; image_url: string }>(`select id, image_url from submission_images`),
  ]);

  for (const row of accounts.rows) {
    if (isLocalUploadUrl(row.avatar_url)) {
      refs.push({ table: "accounts", column: "avatar_url", id: row.id, url: row.avatar_url });
    }
  }
  for (const row of movies.rows) {
    if (isLocalUploadUrl(row.poster_url)) {
      refs.push({ table: "movies", column: "poster_url", id: row.id, url: row.poster_url });
    }
    if (isLocalUploadUrl(row.backdrop_url)) {
      refs.push({ table: "movies", column: "backdrop_url", id: row.id, url: row.backdrop_url });
    }
  }
  for (const row of submissions.rows) {
    if (row.movie_poster_url && isLocalUploadUrl(row.movie_poster_url)) {
      refs.push({
        table: "submissions",
        column: "movie_poster_url",
        id: row.id,
        url: row.movie_poster_url,
      });
    }
  }
  for (const row of sightingImages.rows) {
    if (isLocalUploadUrl(row.image_url)) {
      refs.push({ table: "sighting_images", column: "image_url", id: row.id, url: row.image_url });
    }
  }
  for (const row of submissionImages.rows) {
    if (isLocalUploadUrl(row.image_url)) {
      refs.push({
        table: "submission_images",
        column: "image_url",
        id: row.id,
        url: row.image_url,
      });
    }
  }

  return refs;
}

async function main() {
  const region = requireEnv("AWS_REGION");
  const bucket = requireEnv("S3_BUCKET_NAME");
  const publicBase = getPublicBaseUrl();
  const s3 = new S3Client({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
          }
        : undefined,
  });
  const pool = getDbPool();

  const refs = await collectUrlRefs();
  if (refs.length === 0) {
    console.log("No local /uploads URLs found in DB. Nothing to migrate.");
    return;
  }

  const uniqueLocalUrls = Array.from(new Set(refs.map((r) => r.url)));
  const urlMap = new Map<string, string>();

  for (const localUrl of uniqueLocalUrls) {
    const key = localUrl.replace(/^\/+/, "");
    const absolutePath = path.join(process.cwd(), "public", key.replace(/^uploads\//, "uploads/"));
    const body = await readFile(absolutePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentTypeForKey(key),
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    urlMap.set(localUrl, `${publicBase}/${key}`);
  }

  await pool.query("begin");
  try {
    for (const ref of refs) {
      const nextUrl = urlMap.get(ref.url);
      if (!nextUrl) continue;
      await pool.query(
        `update ${ref.table}
         set ${ref.column} = $1
         where id = $2`,
        [nextUrl, ref.id],
      );
    }
    await pool.query("commit");
  } catch (error) {
    await pool.query("rollback");
    throw error;
  }

  console.log(`Migrated ${uniqueLocalUrls.length} local file(s) to S3.`);
  console.log(`Updated ${refs.length} DB URL reference(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDbPool();
  });
