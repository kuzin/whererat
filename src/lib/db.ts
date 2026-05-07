import { Pool } from "pg";

let sharedPool: Pool | undefined;

function resolveConnectionString(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
  ];
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function requireDatabaseUrl() {
  const url = resolveConnectionString();
  if (!url) {
    throw new Error(
      "Postgres connection string is missing. Set DATABASE_URL " +
        "(preferred), or POSTGRES_URL / POSTGRES_PRISMA_URL from Vercel Postgres or Neon. " +
        "Locally copy .env.example → .env.local (see README). On Vercel assign the var to " +
        "Production and Preview, then redeploy.",
    );
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
