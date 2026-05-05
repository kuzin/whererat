"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import {
  formatApproximateRatLine,
  getRatPresenceScale,
} from "@/lib/whererat";

/** Five rising bars — filled slots show estimated on-screen intensity (solo → swarm). */
const BAR_HEIGHTS_PX = [6, 9, 12, 15, 18];

export function SightingRatPresenceVisual({
  estimatedCount,
  palette,
  className = "",
}: {
  estimatedCount: number;
  palette: boolean;
  /** Row alignment (e.g. trailing on card header). */
  className?: string;
}) {
  const scale = getRatPresenceScale(estimatedCount);
  const line = formatApproximateRatLine(estimatedCount);
  const activeBar = palette
    ? "bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_72%,rgb(120_53_15))] dark:bg-[color-mix(in_srgb,var(--movie-accent,#fbbf24)_66%,rgb(217_119_6))]"
    : "bg-amber-700 dark:bg-amber-300";
  /** Stronger separation: idle bars use a neutral-leaning tint so filled bars read clearly on close palette washes. */
  const idleBar = palette
    ? "bg-[color-mix(in_srgb,var(--movie-accent,#ea580c)_10%,rgb(226_218_205))] dark:bg-[color-mix(in_srgb,var(--movie-accent,#fbbf24)_8%,rgb(103_94_86))]"
    : "bg-stone-300/70 dark:bg-stone-600/65";

  return (
    <div className={`mr-[3px] inline-flex shrink-0 items-center ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`On-screen presence: ${scale.caption}. ${line}.`}
            className="inline-flex cursor-help touch-manipulation items-end gap-1 rounded-md border border-transparent bg-transparent p-0.5 outline-none hover:border-stone-400/30 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/35 dark:hover:border-white/15"
          >
            {BAR_HEIGHTS_PX.map((h, i) => (
              <span
                key={i}
                className={`w-1.5 shrink-0 rounded-sm transition-colors duration-200 ${
                  i < scale.slotsFilled ? activeBar : idleBar
                }`}
                style={{ height: `${h}px` }}
                aria-hidden
              />
            ))}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="end"
          sideOffset={8}
          className="z-[100] max-w-[min(100vw-1rem,16rem)] rounded-lg border-2 border-stone-950/90 bg-[#fdfbf7] px-2.5 py-2 text-left text-xs text-stone-900 shadow-[2px_2px_0_0_rgb(28_25_23/0.45)] dark:border-white/14 dark:bg-[rgb(34_29_24)] dark:text-stone-100 dark:shadow-[2px_2px_0_0_rgb(0_0_0/0.4)]"
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-400">
            On-screen intensity
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight text-stone-950 dark:text-stone-50">
            {scale.caption}
          </p>
          <p className="mt-1 tabular-nums text-stone-700 dark:text-stone-300">
            {line}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
