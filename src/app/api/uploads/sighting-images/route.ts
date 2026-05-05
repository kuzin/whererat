import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MODERATOR_SESSION_COOKIE, parseModeratorSession } from "@/lib/auth";
import type { SightingImageSlot } from "@/lib/whererat";

const SIGHTING_IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_SIGHTING_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, 5);

  if (files.length === 0) {
    return NextResponse.json({ uploaded: [] });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "sightings");
  await mkdir(dir, { recursive: true });

  const uploaded: SightingImageSlot[] = [];
  for (const file of files) {
    const ext = SIGHTING_IMAGE_MIME_EXT[file.type];
    if (!ext || file.size > MAX_SIGHTING_UPLOAD_BYTES) continue;
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const name = `${crypto.randomUUID()}${ext}`;
      await writeFile(path.join(dir, name), buf);
      const safeStem = file.name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 96);
      uploaded.push({
        url: `/uploads/sightings/${name}`,
        alt: safeStem ? `${safeStem} (uploaded)` : "Uploaded sighting photo",
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ uploaded: uploaded.slice(0, 5) });
}
