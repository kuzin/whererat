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
import { RodentTypeIcon } from "@/components/rodent-type-icon";

const MAX_SLOTS = 6;

export function SightingRatPresenceVisual({
  estimatedCount,
  palette: _palette,
  className = "",
}: {
  estimatedCount: number;
  palette: boolean;
  className?: string;
}) {
  const scale = getRatPresenceScale(estimatedCount);
  const line = formatApproximateRatLine(estimatedCount);

  return (
    <div className={`inline-flex shrink-0 items-center ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`On-screen presence: ${scale.caption}. ${line}.`}
            className="inline-flex h-9 cursor-help touch-manipulation items-center gap-0.5 rounded-lg border border-transparent bg-transparent px-2 text-base leading-none outline-none hover:border-stone-400/30 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/35 dark:hover:border-white/15"
          >
            {Array.from({ length: MAX_SLOTS }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`transition-all duration-200 ${i < scale.slotsFilled ? "opacity-100" : "opacity-15 grayscale"}`}
              >
                <RodentTypeIcon openmojiCode="1F400" label="Rat" size={20} />
              </span>
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
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {scale.sublabel}
          </p>
          <p className="mt-1 tabular-nums text-stone-700 dark:text-stone-300">
            {line}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
