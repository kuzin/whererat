import { Pool } from "pg";

let sharedPool: Pool | undefined;

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for Postgres operations.");
  }
  return url;
}

export function getDbPool() {
  if (!sharedPool) {
    sharedPool = new Pool({
      connectionString: requireDatabaseUrl(),
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }
  return sharedPool;
}

export async function closeDbPool() {
  if (!sharedPool) return;
  await sharedPool.end();
  sharedPool = undefined;
}
