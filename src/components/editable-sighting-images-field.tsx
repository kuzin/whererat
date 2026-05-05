"use client";

import Image from "next/image";
import { useMemo, useState, type ChangeEvent } from "react";
import type { SightingImageSlot } from "@/lib/whererat";

type Props = {
  initialImages: SightingImageSlot[];
  label?: string;
};

export function EditableSightingImagesField({
  initialImages,
  label = "Sighting images",
}: Props) {
  const [images, setImages] = useState<SightingImageSlot[]>(initialImages.slice(0, 5));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canAddMore = images.length < 5;
  const helper = useMemo(
    () => `Edit alt text, remove images, or add new uploads (${images.length}/5).`,
    [images.length],
  );

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.currentTarget.files;
    if (!files || files.length === 0 || !canAddMore) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const payload = new FormData();
      Array.from(files)
        .slice(0, 5 - images.length)
        .forEach((file) => payload.append("images", file));
      const response = await fetch("/api/uploads/sighting-images", {
        method: "POST",
        body: payload,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const json = (await response.json()) as { uploaded?: SightingImageSlot[] };
      const uploaded = (json.uploaded ?? []).filter((item) => item?.url).slice(0, 5);
      setImages((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.currentTarget.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-stone-900/12 bg-stone-50/80 p-4 dark:border-white/14 dark:bg-stone-800/35">
      <input type="hidden" name="imageListManaged" value="1" />
      <p className="text-sm font-bold text-stone-800 dark:text-stone-100">{label}</p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">{helper}</p>
      {images.length > 0 ? (
        <div className="mt-4 space-y-3">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="grid gap-3 rounded-lg border border-stone-900/12 bg-white p-3 dark:border-white/12 dark:bg-stone-900/60 sm:grid-cols-[96px_1fr]"
            >
              <Image
                src={image.url}
                alt={image.alt ?? `Sighting image ${index + 1}`}
                width={96}
                height={64}
                className="h-16 w-24 rounded-md object-cover"
              />
              <div className="space-y-2">
                <input type="hidden" name="finalImageUrl" value={image.url} />
                <label className="flex flex-col gap-1 text-xs font-semibold text-stone-700 dark:text-stone-200">
                  Alt text
                  <input
                    name="finalImageAlt"
                    defaultValue={image.alt ?? ""}
                    className="wr-input h-9 text-sm"
                    onChange={(event) => {
                      const next = event.currentTarget.value;
                      setImages((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, alt: next || undefined } : item,
                        ),
                      );
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                  }
                  className="text-xs font-semibold text-red-800 underline decoration-red-700/40 underline-offset-2 hover:decoration-red-800 dark:text-red-300 dark:decoration-red-300/40 dark:hover:decoration-red-300"
                >
                  Remove this image
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">
          No images are attached yet.
        </p>
      )}
      <label className="mt-4 flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
        Add images
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={!canAddMore || isUploading}
          onChange={onFileChange}
          className="wr-input h-auto py-2 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      {isUploading ? (
        <p className="mt-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
          Uploading...
        </p>
      ) : null}
      {uploadError ? (
        <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
