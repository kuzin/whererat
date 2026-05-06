"use client";

import { useEffect, useState } from "react";
import type { ImdbImage, ImdbVideo } from "@/lib/whererat";
import { ImdbLinkButton } from "@/components/imdb-link-button";
import { tabHeaderBorderClass, tabMediaCardClass } from "./movie-tab-classes";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Shrink an IMDb image URL to a thumbnail. */
function imdbThumb(url: string, width = 320): string {
  return url.replace(/\._V1_.*?(\.\w+)$/, `._V1_UX${width}$1`);
}

/** Strip IMDb size hints to get the largest available image. */
function imdbFull(url: string): string {
  return url.replace(/\._V1_.*?(\.\w+)$/, `._V1_$1`);
}

// ── Image lightbox modal ──────────────────────────────────────────────────────

function NavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/85 disabled:opacity-25 disabled:cursor-default"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-5">
        {direction === "prev" ? (
          <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        )}
      </svg>
    </button>
  );
}

function ImageModal({
  images,
  startIndex,
  onClose,
}: {
  images: ImdbImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const image = images[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < images.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) setIdx((i) => i - 1);
      if (e.key === "ArrowRight" && hasNext) setIdx((i) => i + 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/85"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-5">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
        </svg>
      </button>

      {/* Prev / Next — outside the image so they don't affect its click-to-close */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
        <NavButton direction="prev" onClick={() => setIdx((i) => i - 1)} disabled={!hasPrev} />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
        <NavButton direction="next" onClick={() => setIdx((i) => i + 1)} disabled={!hasNext} />
      </div>

      {/* Image — stop click from bubbling to backdrop */}
      <div
        className="relative max-h-[90vh] max-w-[80vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.id}
          src={imdbFull(image.url)}
          alt={image.caption || "Production still"}
          className="max-h-[85vh] max-w-[80vw] rounded-xl object-contain shadow-[0_8px_40px_rgb(0_0_0/0.7)]"
        />
        <div className="mt-3 flex items-center justify-center gap-4">
          {image.caption ? (
            <p className="text-center text-sm text-white/75">{image.caption}</p>
          ) : null}
          <p className="shrink-0 text-xs tabular-nums text-white/40">{idx + 1} / {images.length}</p>
        </div>
      </div>
    </div>
  );
}

// ── Video card ────────────────────────────────────────────────────────────────

function VideoCard({ video, palette }: { video: ImdbVideo; palette: boolean }) {
  const href = `https://www.imdb.com/video/${video.id}/`;
  const cardBase = `${tabMediaCardClass(palette)} transition-shadow hover:shadow-lg group`;

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`flex flex-col no-underline ${cardBase}`}>
      <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imdbThumb(video.thumbnailUrl, 400)}
            alt={video.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-40" aria-hidden>▶</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-xl">
            <span className="ml-0.5 text-xl" aria-hidden>▶</span>
          </div>
        </div>
        {video.runtimeSeconds != null ? (
          <span className="absolute bottom-1.5 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums text-white">
            {formatDuration(video.runtimeSeconds)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        {video.contentType ? (
          <span
            className={`w-fit rounded px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wider ${
              palette
                ? "bg-[color-mix(in_srgb,var(--movie-accent)_18%,rgb(220_210_198))] text-stone-700 dark:bg-[color-mix(in_srgb,var(--movie-accent)_20%,rgb(50_40_30))] dark:text-stone-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            }`}
          >
            {video.contentType}
          </span>
        ) : null}
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-stone-800 group-hover:underline dark:text-stone-200">
          {video.name}
        </p>
      </div>
    </a>
  );
}

// ── Image card (masonry item) ─────────────────────────────────────────────────

function ImageCard({
  image,
  index,
  palette,
  onOpen,
}: {
  image: ImdbImage;
  index: number;
  palette: boolean;
  onOpen: (index: number) => void;
}) {
  const cardBase = `${tabMediaCardClass(palette)} transition-shadow hover:shadow-lg group cursor-zoom-in`;

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`block w-full text-left ${cardBase} mb-4 break-inside-avoid`}
      aria-label={image.caption || "View production still"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imdbThumb(image.url, 400)}
        alt={image.caption || ""}
        className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      />
    </button>
  );
}

// ── Main tab component ────────────────────────────────────────────────────────

type Props = {
  videos: ImdbVideo[];
  images: ImdbImage[];
  imdbId: string;
  palette: boolean;
};

export function MovieRatMediaTab({ videos, images, imdbId, palette }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const headerBorder = tabHeaderBorderClass(palette);
  const sectionTitle = "wr-display mb-4 text-lg font-black uppercase tracking-widest text-stone-600 dark:text-stone-300";
  const divider = `my-8 border-t ${headerBorder}`;
  const hasContent = videos.length > 0 || images.length > 0;

  return (
    <div>
      {lightboxIndex !== null ? (
        <ImageModal images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      ) : null}

      <header className={`mb-6 border-b pb-4 ${headerBorder}`}>
        <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="wr-display text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 sm:text-3xl">
            Media:
          </h2>
          <ImdbLinkButton
            href={`https://www.imdb.com/title/${imdbId}/mediaindex`}
            label="Full gallery on IMDb"
          />
        </div>
      </header>

      {!hasContent ? (
        <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
          No media synced yet. Hit <strong>Resync</strong> to pull videos &amp; photos from IMDb.
        </p>
      ) : (
        <div>
          {videos.length > 0 ? (
            <section>
              <p className={sectionTitle}>Videos ({videos.length})</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} palette={palette} />
                ))}
              </div>
            </section>
          ) : null}

          {videos.length > 0 && images.length > 0 ? (
            <div className={divider} />
          ) : null}

          {images.length > 0 ? (
            <section>
              <p className={sectionTitle}>Photos ({images.length})</p>
              {/* CSS columns masonry — no JS layout needed */}
              <div className="columns-2 gap-4 sm:columns-3">
                {images.map((image, i) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    index={i}
                    palette={palette}
                    onOpen={setLightboxIndex}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
