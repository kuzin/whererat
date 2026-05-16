import type { Meta, StoryObj } from "@storybook/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { TooltipProvider } from "./tooltip-provider";

const meta: Meta<typeof TooltipProvider> = {
  title: "Components/TooltipProvider",
  component: TooltipProvider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Thin wrapper around Radix UI `TooltipProvider` with `delayDuration=280` and `skipDelayDuration=120`. Wrap your app (or the preview root) in this once so all `<Tooltip>` children share the same timing context.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TooltipProvider>;

export const WithTooltip: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="wr-btn-ghost px-4">Hover me</button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="rounded-lg bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-950"
        >
          This is a tooltip
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const MultipleTooltips: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        {["Save", "Duplicate", "Delete"].map((label) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button className="wr-btn-ghost px-4">{label}</button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="rounded-lg bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-950"
            >
              {label} item
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
};
