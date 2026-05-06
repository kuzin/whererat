import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import type { SightingImageSlot } from "@/lib/whererat";

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function isBlobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function sanitizeAlt(fileName: string) {
  const safeStem = fileName.replace(/[^\w.\- ]+/g, "").trim().slice(0, 96);
  return safeStem ? `${safeStem} (uploaded)` : "Uploaded sighting photo";
}

async function writeLocalImage(file: File, folder: "sightings" | "avatars", ext: string) {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const fileName = `${crypto.randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), bytes);
  return `/uploads/${folder}/${fileName}`;
}

async function writeBlobImage(file: File, folder: "sightings" | "avatars", ext: string) {
  const pathname = `${folder}/${crypto.randomUUID()}${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
  });
  return blob.url;
}

export async function persistImageFile(
  file: File,
  options: {
    folder: "sightings" | "avatars";
    maxBytes: number;
  },
) {
  const ext = IMAGE_MIME_EXT[file.type];
  if (!ext || file.size > options.maxBytes || file.size === 0) return undefined;

  if (isBlobEnabled()) {
    return writeBlobImage(file, options.folder, ext);
  }

  return writeLocalImage(file, options.folder, ext);
}

export async function persistSightingFiles(files: File[], maxBytes: number): Promise<SightingImageSlot[]> {
  const out: SightingImageSlot[] = [];
  for (const file of files.slice(0, 5)) {
    const url = await persistImageFile(file, { folder: "sightings", maxBytes });
    if (!url) continue;
    out.push({
      url,
      alt: sanitizeAlt(file.name),
    });
  }
  return out.slice(0, 5);
}
