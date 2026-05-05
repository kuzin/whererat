import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildPostgresSeed } from "@/lib/postgres-seed";

async function main() {
  const seed = buildPostgresSeed();
  const outDir = path.join(process.cwd(), "db");
  const outFile = path.join(outDir, "seed.json");
  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
