"use client";

import { useState, useEffect, useCallback } from "react";
import type { SightingImageSlot } from "@/lib/whererat";

export function SubmissionImageThumbs({ slides }: { slides: SightingImageSlot[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(() => setOpen((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const next = useCallback(
    () => setOpen((i) => (i !== null && i < slides.length - 1 ? i + 1 : i)),
    [slides.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, prev, next]);

  return (
    <>
      {/* Thumbnail strip */}
      <div className="flex flex-wrap gap-2 p-3">
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative h-16 w-16 overflow-hidden rounded-lg border border-stone-900/15 bg-stone-200 dark:border-white/12 dark:bg-stone-800"
            aria-label={slide.alt ?? `Attachment ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.url}
              alt={slide.alt ?? ""}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-white drop-shadow">
                <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" />
              </svg>
            </span>
          </button>
        ))}
        <p className="flex items-center text-xs font-semibold text-stone-400 dark:text-stone-500">
          {slides.length === 1 ? "1 image" : `${slides.length} images`}
        </p>
      </div>

      {/* Lightbox */}
      {open !== null ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[open]!.url}
              alt={slides[open]!.alt ?? ""}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />

            {/* Close */}
            <button
              type="button"
              onClick={close}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg hover:bg-stone-700"
              aria-label="Close"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>

            {/* Prev / Next */}
            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  disabled={open === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-30"
                  aria-label="Previous image"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
                    <path d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={open === slides.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-30"
                  aria-label="Next image"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
                    <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L9.44 8 6.22 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {open + 1} / {slides.length}
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
