"use client";

import { useRef, useState, type DragEvent } from "react";

const ACCEPTED_MIME_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_FILES = 5;

type Preview = { name: string; url: string; file: File };

export function SightingImageUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter((f) => ACCEPTED_MIME_TYPES.split(",").includes(f.type));
    const next = [
      ...previews,
      ...valid.map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f })),
    ].slice(0, MAX_FILES);
    setPreviews(next);
    syncToInput(next);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const next = previews.filter((_, i) => i !== index);
    setPreviews(next);
    syncToInput(next);
  };

  const syncToInput = (list: Preview[]) => {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    list.forEach((p) => transfer.items.add(p.file));
    inputRef.current.files = transfer.files;
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const canAddMore = previews.length < MAX_FILES;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
        Sighting images{" "}
        <span className="font-medium text-stone-400 dark:text-stone-500">(optional, max {MAX_FILES})</span>
      </span>

      {previews.length === 0 ? (
        /* ── Empty state: full drop zone ── */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            isDragging
              ? "border-amber-500 bg-amber-100/80 dark:border-amber-400 dark:bg-amber-900/35"
              : "border-stone-950/18 bg-stone-50/60 hover:border-stone-950/30 hover:bg-stone-50 dark:border-white/14 dark:bg-stone-900/40 dark:hover:border-white/25 dark:hover:bg-stone-900/60"
          }`}
        >
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500 dark:text-stone-400" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            Drop images here, or{" "}
            <span className="text-orange-600 underline underline-offset-2 decoration-dashed dark:text-amber-400">
              browse
            </span>
          </p>
          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
            JPEG, PNG, WebP or GIF · up to 8 MB each
          </p>
        </div>
      ) : (
        /* ── Has files: thumbnail grid ── */
        <div
          onDragOver={canAddMore ? onDragOver : undefined}
          onDragLeave={canAddMore ? onDragLeave : undefined}
          onDrop={canAddMore ? onDrop : undefined}
          className={`rounded-xl border-2 p-3 transition-colors ${
            isDragging
              ? "border-amber-500 bg-amber-100/80 dark:border-amber-400 dark:bg-amber-900/35"
              : "border-stone-950/14 bg-stone-50/60 dark:border-white/12 dark:bg-stone-900/40"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={p.url} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.name}
                  className="h-20 w-20 rounded-lg object-cover ring-2 ring-stone-950/12 dark:ring-white/12"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[11px] font-black leading-none text-white opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-stone-100 dark:text-stone-900"
                >
                  ×
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label="Add more images"
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-950/18 text-stone-400 transition-colors hover:border-stone-950/30 hover:text-stone-600 dark:border-white/14 dark:text-stone-500 dark:hover:border-white/25 dark:hover:text-stone-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5v14" />
                </svg>
                <span className="text-[10px] font-semibold">Add more</span>
              </button>
            )}
          </div>

          <p className="mt-2.5 text-xs text-stone-400 dark:text-stone-500">
            {previews.length} of {MAX_FILES} · JPEG, PNG, WebP or GIF · up to 8 MB each
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        name="sightingImages"
        type="file"
        multiple
        accept={ACCEPTED_MIME_TYPES}
        onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        className="sr-only"
      />
    </div>
  );
}
