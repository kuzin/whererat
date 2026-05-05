import { readFile } from "node:fs/promises";
import path from "node:path";
import "./load-env";
import { closeDbPool, getDbPool } from "@/lib/db";

async function main() {
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const pool = getDbPool();
  await pool.query(schemaSql);
  console.log("Applied db/schema.sql");
  await closeDbPool();
}

main().catch(async (error) => {
  console.error(error);
  await closeDbPool();
  process.exitCode = 1;
});
