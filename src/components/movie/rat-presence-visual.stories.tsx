import type { Meta, StoryObj } from "@storybook/react";
import { SightingRatPresenceVisual } from "./rat-presence-visual";

const meta: Meta<typeof SightingRatPresenceVisual> = {
  title: "Components/Movie/RatPresenceVisual",
  component: SightingRatPresenceVisual,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Up to 6 rat-icon slots showing estimated on-screen presence intensity. Filled slots = active; gray = empty. Hover shows a Radix tooltip with the caption and count breakdown.",
      },
    },
  },
  args: { palette: false },
};
export default meta;

type Story = StoryObj<typeof SightingRatPresenceVisual>;

export const OneRat: Story = {
  args: { estimatedCount: 1 },
};

export const ThreeRats: Story = {
  args: { estimatedCount: 3 },
};

export const MaxRats: Story = {
  args: { estimatedCount: 20 },
};

export const AllCounts: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {[1, 2, 3, 5, 8, 15].map((count) => (
        <div key={count} className="flex flex-col items-center gap-1">
          <SightingRatPresenceVisual estimatedCount={count} palette={false} />
          <span className="text-xs text-stone-400">{count}</span>
        </div>
      ))}
    </div>
  ),
};
