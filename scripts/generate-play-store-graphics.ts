/**
 * Rasterize brand SVGs into Google Play Console listing sizes.
 *
 * Outputs (under store-listing/play/):
 * - play-store-icon-512.png — 512×512 orange rounded tile + white rat only (`rat.svg`, no favicon moon)
 * - play-feature-graphic-1024x500.png — full-bleed cheese texture, centered brand-orange rat + wordmark at matched height
 *
 * Run: npx tsx scripts/generate-play-store-graphics.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "store-listing", "play");

const PLAY_W = 1024;
const PLAY_H = 500;
const BRAND_ORANGE = "#ea580c";
/** Inset rat from square edge (Play adaptive icon safe zone-ish). */
const ICON_CONTENT_INSET = 100;
const WHITE = "#ffffff";

function stripSvgComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function ratSvgFilled(fill: string): Buffer {
  let s = fs.readFileSync(path.join(ROOT, "public", "brand", "rat.svg"), "utf8");
  s = stripSvgComments(s);
  s = s.replace(
    '<g id="Layer_1-2" data-name="Layer 1">',
    `<g id="Layer_1-2" data-name="Layer 1" fill="${fill}">`,
  );
  return Buffer.from(s);
}

async function rasterizePlayIcon512(): Promise<Buffer> {
  const maxSide = 512 - 2 * ICON_CONTENT_INSET;
  const ratPng = await sharp(ratSvgFilled(WHITE))
    .resize(maxSide, maxSide, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="${BRAND_ORANGE}"/></svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  const rm = await sharp(ratPng).metadata();
  const rw = rm.width ?? 0;
  const rh = rm.height ?? 0;
  const left = Math.round((512 - rw) / 2);
  const top = Math.round((512 - rh) / 2);

  return sharp(bg)
    .composite([{ input: ratPng, left, top }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cheesePath = path.join(ROOT, "public", "brand", "cheese-texture-shutterstock.jpg");
  const logoPath = path.join(ROOT, "public", "brand", "logo.svg");

  const iconPng = await rasterizePlayIcon512();

  const iconOut = path.join(OUT_DIR, "play-store-icon-512.png");
  await fs.promises.writeFile(iconOut, iconPng);
  console.log("Wrote", path.relative(ROOT, iconOut));

  /** Matched dominant height for rat + wordmark (px). */
  const lockHeight = Math.round(PLAY_H * 0.34);

  let logoSvg = fs.readFileSync(logoPath, "utf8");
  logoSvg = stripSvgComments(logoSvg);
  logoSvg = logoSvg.replace(/fill="#000"/g, `fill="${BRAND_ORANGE}"`);

  const logoPng = await sharp(Buffer.from(logoSvg))
    .resize({
      height: lockHeight,
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const ratForBanner = await sharp(ratSvgFilled(BRAND_ORANGE))
    .resize({
      height: lockHeight,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoPng).metadata();
  const ratMeta = await sharp(ratForBanner).metadata();
  const lw = logoMeta.width ?? 0;
  const lh = logoMeta.height ?? lockHeight;
  const rw = ratMeta.width ?? 0;
  const rh = ratMeta.height ?? lockHeight;

  const gap = 36;
  const totalW = rw + gap + lw;
  const startX = Math.round((PLAY_W - totalW) / 2);
  const rowH = Math.max(rh, lh);
  const ratTop = Math.round((PLAY_H - rowH) / 2 + (rowH - rh) / 2);
  const logoTop = Math.round((PLAY_H - rowH) / 2 + (rowH - lh) / 2);

  const base = await sharp(cheesePath)
    .resize(PLAY_W, PLAY_H, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  const banner = await sharp(base)
    .composite([
      { input: ratForBanner, left: startX, top: ratTop },
      { input: logoPng, left: startX + rw + gap, top: logoTop },
    ])
    .png()
    .toBuffer();

  const fgOut = path.join(OUT_DIR, "play-feature-graphic-1024x500.png");
  await fs.promises.writeFile(fgOut, banner);
  console.log("Wrote", path.relative(ROOT, fgOut));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
