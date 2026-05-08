/**
 * Cursor workflow for Play Phone backdrop images (no OpenAI API).
 *
 * - No arguments: prints `store-listing/play/cursor-phone-bg.prompt.txt` and usage.
 * - With a path: resizes/covers to **1080×1920** → **`store-listing/play/ai-phone-bg.png`**.
 *
 * npm run store:play:backdrop -- path/from/cursor/export.png
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const PROMPT_PATH = path.join(
  ROOT,
  "store-listing",
  "play",
  "cursor-phone-bg.prompt.txt",
);
const OUT_PATH = path.join(ROOT, "store-listing", "play", "ai-phone-bg.png");
const W = 1080;
const H = 1920;

async function main() {
  const input = process.argv[2]?.trim();
  if (!input) {
    if (fs.existsSync(PROMPT_PATH)) {
      process.stdout.write(fs.readFileSync(PROMPT_PATH, "utf8"));
      process.stdout.write("\n");
    } else {
      console.error("Missing prompt file:", PROMPT_PATH);
    }
    console.log("—");
    console.log("Import an image Cursor saved elsewhere:");
    console.log(`  npm run store:play:backdrop -- ./Downloads/my-backdrop.png`);
    console.log("Then:");
    console.log(`  npm run store:play:screenshots`);
    return;
  }

  const resolved = path.isAbsolute(input)
    ? input
    : path.resolve(process.cwd(), input);
  if (!fs.existsSync(resolved)) {
    console.error("File not found:", resolved);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  await sharp(resolved)
    .resize(W, H, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(OUT_PATH);

  const st = fs.statSync(OUT_PATH);
  console.log(`Wrote ${path.relative(process.cwd(), OUT_PATH)}`);
  console.log(`  ${W}×${H}  ${(st.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Run: npm run store:play:screenshots`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
