import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { SightingImageSlot } from "@/lib/whererat";

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

let s3Client: S3Client | null = null;

function isS3Enabled() {
  return Boolean(process.env.S3_BUCKET_NAME?.trim() && process.env.AWS_REGION?.trim());
}

function shouldFallbackToLocal() {
  const value = process.env.UPLOAD_FALLBACK_TO_LOCAL?.trim().toLowerCase();
  if (value === "false" || value === "0" || value === "no") return false;
  return process.env.NODE_ENV !== "production";
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION?.trim(),
      credentials:
        process.env.AWS_ACCESS_KEY_ID?.trim() &&
        process.env.AWS_SECRET_ACCESS_KEY?.trim()
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
            }
          : undefined,
    });
  }
  return s3Client;
}

function sanitizeAlt(fileName: string) {
  const safeStem = fileName.replace(/[^\w.\- ]+/g, "").trim().slice(0, 96);
  return safeStem ? `${safeStem} (uploaded)` : "Uploaded sighting photo";
}

function joinUrl(base: string, key: string) {
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

function getPublicBaseUrl() {
  const custom = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (custom) return custom;
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  const region = process.env.AWS_REGION?.trim();
  if (!bucket || !region) return "";
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

async function writeLocalImage(file: File, folder: "sightings" | "avatars", ext: string) {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const fileName = `${crypto.randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), bytes);
  return `/uploads/${folder}/${fileName}`;
}

async function writeS3Image(file: File, folder: "sightings" | "avatars", ext: string) {
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  if (!bucket) throw new Error("S3 bucket is not configured.");
  const key = `uploads/${folder}/${crypto.randomUUID()}${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const base = getPublicBaseUrl();
  if (!base) throw new Error("S3 public base URL is not configured.");
  return joinUrl(base, key);
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

  if (isS3Enabled()) {
    try {
      return await writeS3Image(file, options.folder, ext);
    } catch {
      if (!shouldFallbackToLocal()) throw new Error("S3 upload failed.");
    }
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
