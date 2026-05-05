import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

const root = process.cwd();
const localEnv = path.join(root, ".env.local");
const baseEnv = path.join(root, ".env");

if (existsSync(localEnv)) {
  config({ path: localEnv });
}
if (existsSync(baseEnv)) {
  config({ path: baseEnv, override: false });
}
