/**
 * Compose Google Play phone listing screenshots:
 * backdrop + headline + subtitle above a real screenshot (centered, rounded corners).
 *
 * **Backdrop priority:** **`--bg path`** → **`WHERE_RAT_PLAY_BG`** → **`public/brand/cheese-texture-shutterstock.jpg`**.
 * Optional **`ai-phone-bg.png`**: **`--bg store-listing/play/ai-phone-bg.png`** only (never auto‑picked).
 *
 * Output: portrait **1080×1920** (9:16). PNG default, or **`--jpeg`**.
 *
 * Setup:
 * 1. Export four phone captures (PNG or JPEG) into `store-listing/play/phone-sources/`.
 * 2. Optionally copy `manifest.example.json` → `manifest.json` and set `"file"` to your filenames + copy lines.
 *
 * Run: `npx tsx scripts/generate-play-phone-screenshots.ts`
 * JPEG: `npx tsx scripts/generate-play-phone-screenshots.ts --jpeg`
 *
 * Typography matches site H1 / `.wr-display`: Fredoka **700** + **500** (`globals.css`).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const CHEESE_PATH = path.join(
  ROOT,
  "public",
  "brand",
  "cheese-texture-shutterstock.jpg",
);
const SRC_DIR = path.join(ROOT, "store-listing", "play", "phone-sources");
const OUT_DIR = path.join(ROOT, "store-listing", "play", "phone");
const FONT_DIR = path.join(ROOT, "store-listing", "play", "fonts");
/** Fontsource-aligned Latin woff2 (matches web Fredoka subset for listing copy). */
const FONT_FREDOKA_W2_500 = path.join(FONT_DIR, "fredoka-latin-500-normal.woff2");
const FONT_FREDOKA_W2_700 = path.join(FONT_DIR, "fredoka-latin-700-normal.woff2");

/** Listing portrait canvas (9×16). */
const W = 1080;
const H = 1920;
/** Side inset — smaller ⇒ larger handset. */
const H_PAD = 12;
/** Bottom inset. */
const BOTTOM_PAD = 12;
const BRAND_ORANGE = "#ea580c";
/** Subtitle ink (site foreground). */
const BODY_TEXT = "#1c1410";
/** Halo for legibility on busy cheese texture (same idea as earliest script). */
const TEXT_HALO = "#fffbeb";
/** Title/subtitle — Fredoka per `globals.css` `--font-display` (Fredoka latin woff2 in compose). */
const TITLE_FS = 78;
const TITLE_LEAD = 92;
const SUB_FS = 38;
const SUB_LEAD = 50;
const TITLE_SUB_GAP = 18;
const TITLE_WRAP = 22;
const SUB_WRAP = 40;

const FREDOKA_500_SRC = fs.existsSync(FONT_FREDOKA_W2_500)
  ? pathToFileURL(FONT_FREDOKA_W2_500).href
  : "";
const FREDOKA_700_SRC = fs.existsSync(FONT_FREDOKA_W2_700)
  ? pathToFileURL(FONT_FREDOKA_W2_700).href
  : "";

type SlideManifest = {
  file: string;
  title: string;
  subtitle?: string;
};

type ManifestShape = {
  slides: SlideManifest[];
};

function resolveBackdropPath(argv: string[]): string {
  const eq = argv.find((a) => a.startsWith("--bg="));
  if (eq) {
    const raw = eq.slice("--bg=".length).trim();
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }

  const i = argv.indexOf("--bg");
  if (i !== -1) {
    const next = argv[i + 1];
    if (next && !next.startsWith("-")) {
      return path.isAbsolute(next) ? next : path.resolve(process.cwd(), next);
    }
  }

  const env = process.env.WHERE_RAT_PLAY_BG?.trim();
  if (env) {
    return path.isAbsolute(env) ? env : path.resolve(ROOT, env);
  }

  return CHEESE_PATH;
}

/** Wrap at word boundaries; lines never exceed approx width for raster SVG. */
function wrapLines(text: string, maxChars: number): string[] {
  const t = text.trim();
  if (!t) return [];
  const words = t.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (w.length > maxChars) {
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      // Long token: split hard
      for (let i = 0; i < w.length; i += maxChars) {
        lines.push(w.slice(i, i + maxChars));
      }
      continue;
    }
    if (cand.length <= maxChars) cur = cand;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Vertical space occupied by headline block for one slide (px). */
function measureTextStack(slide: SlideManifest): number {
  const titleLines = wrapLines(slide.title, TITLE_WRAP);
  const subLines = slide.subtitle ? wrapLines(slide.subtitle, SUB_WRAP) : [];
  const th = titleLines.length * TITLE_LEAD;
  const sh = subLines.length * SUB_LEAD;
  return th + (subLines.length ? TITLE_SUB_GAP + sh : 0);
}

/** One header strip height for the whole batch (all slides vertically aligned). */
function headerStripPx(slides: SlideManifest[]): number {
  const stacks = slides.map(measureTextStack);
  const maxStack = stacks.length ? Math.max(...stacks) : TITLE_LEAD * 2 + SUB_LEAD + TITLE_SUB_GAP;
  const padded = Math.round(maxStack + 52);
  return Math.min(440, Math.max(272, padded));
}

function buildWrappedTextSpans(
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
  attrs: Record<string, string>,
): string {
  if (!lines.length) return "";
  let y = startY;
  let out = "";
  for (const line of lines) {
    const a = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`)
      .join("");
    out += `\n    <text x="${centerX}" y="${y}" text-anchor="middle"${a}>${escapeXml(line)}</text>`;
    y += lineHeight;
  }
  return out;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readManifest(): ManifestShape | null {
  const p = path.join(SRC_DIR, "manifest.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as ManifestShape;
}

function listSourceImages(): string[] {
  if (!fs.existsSync(SRC_DIR)) return [];
  const skip = new Set(["manifest.json", "manifest.example.json"]);
  return fs
    .readdirSync(SRC_DIR)
    .filter(
      (n) =>
        /\.(png|jpeg|jpg)$/i.test(n) && !skip.has(n) && !n.startsWith("."),
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** Seeded listing copy when `manifest.json` is absent (first four capture files, sorted). */
const DEFAULT_SLIDES: Omit<SlideManifest, "file">[] = [
  {
    title: "Rat on screen? Find the movie.",
    subtitle:
      "Spoiler-smart crowd catalog. Sort, filter, and dig in without nasty surprises.",
  },
  {
    title: "Pause - there's the rat.",
    subtitle:
      "Timestamps and notes on every title page. Jump straight to the moment.",
  },
  {
    title: "Spotted one? Log it.",
    subtitle:
      "Share what you saw with context. Moderators fold the best into the catalog.",
  },
  {
    title: "Built for curious viewers",
    subtitle:
      "Ratings, spoiler rules, privacy, and moderation - in plain language in-app.",
  },
];

function resolveSlides(): SlideManifest[] {
  const files = listSourceImages();
  if (files.length < 4) {
    console.error(
      [
        `Need at least four PNG/JPEG screenshots in:`,
        `  ${SRC_DIR}`,
        `Found ${files.length} image(s). See manifest.example.json.`,
      ].join("\n"),
    );
    process.exit(1);
  }

  const fallback = files.slice(0, 4);
  const manifest = readManifest();
  if (!manifest?.slides?.length) {
    return fallback.map((f, i) => ({
      file: f,
      ...DEFAULT_SLIDES[i]!,
    }));
  }

  if (manifest.slides.length !== 4) {
    console.error("manifest.json must contain exactly four `slides[]` entries.");
    process.exit(1);
  }

  const out: SlideManifest[] = [];
  for (let i = 0; i < 4; i++) {
    const m = manifest.slides[i]!;
    if (!fallback.includes(m.file)) {
      console.warn(
        `manifest "${m.file}" not found — using sorted file "${fallback[i]}"`,
      );
      out.push({
        file: fallback[i]!,
        title: m.title,
        subtitle: m.subtitle,
      });
    } else {
      out.push(m);
    }
  }
  return out;
}

async function rasterHeader(slide: SlideManifest, stripH: number): Promise<Buffer> {
  const cx = W / 2;

  const titleLines = wrapLines(slide.title, TITLE_WRAP);
  const subLines = slide.subtitle ? wrapLines(slide.subtitle, SUB_WRAP) : [];

  const titleBlockH = titleLines.length * TITLE_LEAD;
  const subBlockH = subLines.length * SUB_LEAD;
  const stack =
    titleBlockH + (subLines.length ? TITLE_SUB_GAP + subBlockH : 0);
  const topPad = Math.max(18, Math.round((stripH - stack) / 2));
  const firstTitleY = topPad + TITLE_FS * 0.72;
  const yAfterTitles = firstTitleY + titleLines.length * TITLE_LEAD;
  const firstSubY = subLines.length
    ? yAfterTitles + TITLE_SUB_GAP + SUB_FS * 0.78
    : 0;

  const titleAttrs: Record<string, string> = {
    "font-family": "Fredoka, ui-rounded, system-ui, sans-serif",
    "font-size": String(TITLE_FS),
    "font-weight": "700",
    fill: BRAND_ORANGE,
    "letter-spacing": "-0.03em",
    stroke: TEXT_HALO,
    "stroke-width": "7",
    "stroke-opacity": "0.98",
    "stroke-linejoin": "round",
    "paint-order": "stroke fill",
  };

  const subAttrs: Record<string, string> = {
    "font-family": "Fredoka, ui-rounded, system-ui, sans-serif",
    "font-size": String(SUB_FS),
    "font-weight": "500",
    fill: BODY_TEXT,
    "fill-opacity": "0.96",
    "letter-spacing": "-0.02em",
    stroke: TEXT_HALO,
    "stroke-width": "5",
    "stroke-opacity": "0.97",
    "stroke-linejoin": "round",
    "paint-order": "stroke fill",
  };

  const titleTexts = buildWrappedTextSpans(titleLines, cx, firstTitleY, TITLE_LEAD, titleAttrs);
  const subTexts = subLines.length
    ? buildWrappedTextSpans(subLines, cx, firstSubY, SUB_LEAD, subAttrs)
    : "";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${stripH}">
  <defs>
    <style type="text/css"><![CDATA[
      @font-face {
        font-family: 'Fredoka';
        font-style: normal;
        font-weight: 500;
        font-display: swap;
        src: url('${FREDOKA_500_SRC}') format('woff2');
      }
      @font-face {
        font-family: 'Fredoka';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url('${FREDOKA_700_SRC}') format('woff2');
      }
    ]]></style>
  </defs>
  ${titleTexts}
  ${subTexts}
</svg>`.trim();
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function composeSlide(
  slide: SlideManifest,
  useJpeg: boolean,
  jpegQ: number,
  backdropPath: string,
  headerStripH: number,
) {
  const srcAbs = path.join(SRC_DIR, slide.file);
  if (!fs.existsSync(srcAbs)) {
    console.error(`Missing screenshot: ${slide.file}`);
    process.exit(1);
  }

  const headerPng = await rasterHeader(slide, headerStripH);

  const bodyTop = headerStripH + 4;
  const bodyH = H - bodyTop - BOTTOM_PAD;
  const innerW = W - H_PAD * 2;

  /**
   * `fit: "inside"` with transparent matte, then **`ensureAlpha()`** keep PNG gutters truly transparent
   * (avoid extra SVG reraster passes that flattened letterboxing onto the handset).
   */
  const shotScaled = await sharp(srcAbs)
    .resize(innerW, bodyH, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  const smeta = await sharp(shotScaled).metadata();
  const sw = smeta.width ?? innerW;
  const sh = smeta.height ?? bodyH;

  const slotLeft = Math.round((W - sw) / 2);
  const slotTop = Math.round(bodyTop + (bodyH - sh) / 2);

  if (!fs.existsSync(backdropPath)) {
    console.error("Missing backdrop image:", backdropPath);
    process.exit(1);
  }

  const base = await sharp(backdropPath)
    .resize(W, H, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const out: Buffer = await sharp(base)
    .composite([
      { input: shotScaled, left: slotLeft, top: slotTop },
      { input: headerPng, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  if (!useJpeg) {
    return { buffer: out, ext: "png" as const };
  }
  const jpegBuf = await sharp(out).jpeg({ quality: jpegQ, mozjpeg: true }).toBuffer();
  return { buffer: jpegBuf, ext: "jpg" as const };
}

async function main() {
  const argv = process.argv.slice(2);
  const useJpeg = argv.includes("--jpeg");
  const jpegQ = 92;
  const backdropPath = resolveBackdropPath(argv);
  console.log("Backdrop:", path.relative(ROOT, backdropPath));

  if (!FREDOKA_500_SRC || !FREDOKA_700_SRC) {
    console.error(
      [
        "Missing Fredoka woff2 for store screenshots. Expected:",
        `  ${FONT_FREDOKA_W2_500}`,
        `  ${FONT_FREDOKA_W2_700}`,
        "",
        "(Fontsource Latin slices; Fredoka remains OFL — see bundled LICENSE in @fontsource/fredoka on npm)",
      ].join("\n"),
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const slides = resolveSlides();
  const headerStripH = headerStripPx(slides);
  console.log("Header strip height:", headerStripH);

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    const { buffer, ext } = await composeSlide(
      slide,
      useJpeg,
      jpegQ,
      backdropPath,
      headerStripH,
    );
    const name = `play-phone-0${i + 1}.${ext}`;
    const dest = path.join(OUT_DIR, name);
    await fs.promises.writeFile(dest, buffer);
    const mb = buffer.length / (1024 * 1024);
    const meta = await sharp(buffer).metadata();
    console.log(
      `Wrote ${path.relative(ROOT, dest)}  ${meta.width}×${meta.height}  ${mb.toFixed(2)} MB`,
    );
    if (mb > 8) {
      console.warn(`  ⚠ over 8 MB — use --jpeg or trim source PNG size`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
