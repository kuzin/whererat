"use client";

import Image from "next/image";
import { useCallback, useId, useRef, useState, type CSSProperties } from "react";
import type { SightingImageSlot } from "@/lib/whererat";

/** CSS var fallback (#ea580c) when `--movie-accent` is unset (moderation etc.). */

const carouselNavBtnClass =
  "absolute top-1/2 z-10 grid min-h-[2.85rem] min-w-[2.85rem] -translate-y-1/2 place-items-center rounded-xl px-1 text-[1.65rem] font-bold leading-none backdrop-blur-md " +
  "bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_44%,rgb(15_14_13/0.9))] " +
  "text-[#fffbeb] transition-[transform,background-color] duration-200 ease-out " +
  "hover:scale-[1.07] hover:bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_58%,rgb(10_9_9/0.92))] " +
  "active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[color-mix(in_srgb,var(--movie-accent,#ea580c)_65%,rgb(251_191_36))] " +
  "motion-reduce:transition-colors motion-reduce:hover:scale-100";

const carouselDotRailClass =
  "absolute bottom-3 left-1/2 z-10 flex max-w-[min(calc(100%-1.5rem),22rem)] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-[999px] px-3 py-2.5 backdrop-blur-md " +
  "bg-[color-mix(in_srgb,rgb(12_10_9)_82%,var(--movie-accent,#ea580c))]";

type Props = {
  slides: SightingImageSlot[];
  /** Subtle stripe style for prev/next resting on carousel */
  className?: string;
  /**
   * When the sighting is spoiler-flagged and the visitor has not enabled “show spoilers”,
   * stills are blurred and an overlay explains why.
   */
  spoilerHidden?: boolean;
};

export function SightingImageCarousel({
  slides,
  className = "",
  spoilerHidden = false,
}: Props) {
  const baseId = useId();
  const [index, setIndex] = useState(0);
  const dirRef = useRef<1 | -1>(1);
  const [motionOn, setMotionOn] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const n = slides.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      dirRef.current = dir;
      setMotionOn(true);
      setIndex((prev) => (prev + dir + n) % n);
    },
    [n],
  );

  const jumpTo = useCallback(
    (target: number) => {
      if (target === index) return;
      const cw = (target - index + n) % n;
      const ccw = (index - target + n) % n;
      dirRef.current = cw <= ccw ? 1 : -1;
      setMotionOn(true);
      setIndex(target);
    },
    [index, n],
  );

  if (n === 0) return null;

  const current = slides[index]!;
  const labelId = `${baseId}-label`;

  return (
    <div
      data-sighting-carousel=""
      aria-roledescription="carousel"
      aria-labelledby={n > 1 ? labelId : undefined}
      tabIndex={n > 1 ? 0 : undefined}
      onKeyDown={
        n > 1
          ? (event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                go(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                go(1);
              }
            }
          : undefined
      }
      onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < 30) return;
        go(delta < 0 ? 1 : -1);
      }}
      className={`relative outline-none ${n > 1 ? "focus-visible:ring-2 focus-visible:ring-amber-500/85 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900/10" : ""} ${className}`}
    >
      {n > 1 ? (
        <p id={labelId} className="sr-only">
          Image carousel, {n} slides. Use arrows, dots, or left and right arrow keys while focused here.
        </p>
      ) : null}

      <div className="relative aspect-video overflow-hidden bg-stone-900/25 sm:aspect-[21/9]">
        <div
          key={`slide-${index}`}
          style={
            {
              "--wr-carousel-dx":
                dirRef.current === 1 ? "clamp(12px,3vw,20px)" : "clamp(-20px,-3vw,-12px)",
            } as CSSProperties
          }
          className={
            motionOn
              ? "relative z-[1] h-full w-full wr-carousel-slide-enter"
              : "relative z-[1] h-full w-full"
          }
        >
          <Image
            src={current.url}
            alt={
              spoilerHidden
                ? "Spoiler image hidden"
                : current.alt?.trim() || "Sighting reference still"
            }
            width={900}
            height={500}
            className={`h-full w-full object-cover ${spoilerHidden ? "scale-[1.03] blur-2xl brightness-[0.65]" : ""}`}
            sizes="(min-width: 1024px) 900px, 100vw"
            priority={index === 0}
          />
        </div>

        {spoilerHidden ? (
          <div
            className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-black/75 via-black/45 to-black/25 px-6 text-center"
            aria-hidden={true}
          >
            <p className="wr-display max-w-[20rem] text-lg font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgb(0_0_0/0.85)] sm:text-xl">
              Spoiler warning
            </p>
            <p className="max-w-[22rem] text-sm font-semibold text-white/90 drop-shadow-[0_1px_4px_rgb(0_0_0/0.75)]">
              Turn on “Show spoilers” above to view these images.
            </p>
          </div>
        ) : null}

        {n > 1 && !spoilerHidden ? (
          <>
            <button
              type="button"
              aria-label="Previous sighting photo"
              onClick={() => go(-1)}
              className={`${carouselNavBtnClass} left-2 sm:left-3`}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next sighting photo"
              onClick={() => go(1)}
              className={`${carouselNavBtnClass} right-2 sm:right-3`}
            >
              ›
            </button>

            <div
              role="tablist"
              aria-label="Choose sighting photo"
              className={carouselDotRailClass}
            >
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Photo ${i + 1} of ${n}`}
                  onClick={() => jumpTo(i)}
                  className={`rounded-full transition-[width,transform,background-color] duration-300 ease-out motion-reduce:duration-150 ${
                    i === index
                      ? "h-2.5 min-w-[1.625rem] scale-105 bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_78%,rgb(254_252_246))]"
                      : "h-2.5 w-2.5 shrink-0 bg-white hover:bg-amber-50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : n > 1 && spoilerHidden ? (
          <p className="sr-only">
            Image carousel controls hidden until spoilers are shown.
          </p>
        ) : null}
      </div>
    </div>
  );
}
