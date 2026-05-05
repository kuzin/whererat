"use client";

import { useRef, useState, type DragEvent } from "react";

const ACCEPTED_MIME_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export function SightingImageUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const syncFilesFromInput = () => {
    const files = Array.from(inputRef.current?.files ?? []);
    setSelectedFiles(files.map((file) => file.name));
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

    const dropped = Array.from(event.dataTransfer.files).filter((file) =>
      ACCEPTED_MIME_TYPES.split(",").includes(file.type),
    );

    if (!inputRef.current || dropped.length === 0) return;

    const transfer = new DataTransfer();
    dropped.slice(0, 5).forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
    syncFilesFromInput();
  };

  return (
    <label className="flex flex-col gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
      Sighting images (optional, max 5)
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-amber-500 bg-amber-100/80 dark:border-amber-400 dark:bg-amber-900/35"
            : "border-stone-950/40 bg-amber-50/70 dark:border-white/20 dark:bg-stone-900/55"
        }`}
      >
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          Drag and drop images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="underline decoration-dashed underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            choose files
          </button>
          .
        </p>
        <input
          ref={inputRef}
          name="sightingImages"
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES}
          onChange={syncFilesFromInput}
          className="sr-only"
        />
        {selectedFiles.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-stone-600 dark:text-stone-300">
            {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected:{" "}
            {selectedFiles.join(", ")}
          </p>
        ) : null}
      </div>
      <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
        JPEG, PNG, WebP, or GIF — up to 8 MB each. Saved under{" "}
        <span className="font-mono">/public/uploads/sightings</span> for moderator
        review (local prototype).
      </span>
    </label>
  );
}
