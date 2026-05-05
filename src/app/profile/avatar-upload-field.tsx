"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";

const ACCEPTED_MIME_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export function AvatarUploadField({
  initialAvatarUrl,
  displayName,
}: {
  initialAvatarUrl: string;
  displayName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(initialAvatarUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | undefined>();

  const syncFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const dropped = Array.from(event.dataTransfer.files).find((file) =>
      ACCEPTED_MIME_TYPES.split(",").includes(file.type),
    );
    if (!dropped || !inputRef.current) return;

    const transfer = new DataTransfer();
    transfer.items.add(dropped);
    inputRef.current.files = transfer.files;
    syncFile(dropped);
  };

  return (
    <div className="grid gap-3">
      <input name="currentAvatarUrl" type="hidden" value={initialAvatarUrl} />
      <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
        Profile image
      </p>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-amber-500 bg-amber-100/80 dark:border-amber-400 dark:bg-amber-900/35"
            : "border-stone-950/30 bg-amber-50/65 dark:border-white/20 dark:bg-stone-900/55"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Image
            src={previewUrl}
            alt={`${displayName} avatar preview`}
            width={120}
            height={120}
            className="h-20 w-20 rounded-xl border border-stone-900/20 object-cover dark:border-white/16"
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              Drag and drop a new image, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="underline decoration-dashed underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              >
                choose a file
              </button>
              .
            </p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              JPEG, PNG, WebP, or GIF up to 8 MB.
            </p>
            {fileName ? (
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Selected: {fileName}
              </p>
            ) : null}
          </div>
        </div>
        <input
          ref={inputRef}
          name="avatarImage"
          type="file"
          accept={ACCEPTED_MIME_TYPES}
          className="sr-only"
          onChange={(event) => syncFile(event.currentTarget.files?.[0])}
        />
      </div>
    </div>
  );
}
