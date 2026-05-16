"use client";

import { TooltipProvider as RadixTooltipProvider } from "@radix-ui/react-tooltip";

/**
 * App-wide Radix tooltip context.
 *
 * Convention for any <TooltipContent> rendered under this provider:
 *  • `sideOffset={12}` — a few px below the trigger so the gap roughly
 *    matches the page's horizontal margins.
 *  • `collisionPadding={16}` — keeps the tooltip clear of viewport edges.
 *  • Width: `w-[calc(100vw-2rem)] max-w-[16rem] sm:w-auto` so the tooltip
 *    spans full-width-minus-page-padding on mobile and shrinks to content
 *    on `sm:` and up.
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixTooltipProvider delayDuration={280} skipDelayDuration={120}>
      {children}
    </RadixTooltipProvider>
  );
}
