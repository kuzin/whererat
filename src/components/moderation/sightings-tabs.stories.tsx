import type { Meta, StoryObj } from "@storybook/react";
import { SightingsTabs } from "./sightings-tabs";

const meta: Meta<typeof SightingsTabs> = {
  title: "Components/Moderation/SightingsTabs",
  component: SightingsTabs,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Three-tab bar (Pending / Approved / Denied) with counts and status indicator dots. Manages active tab in local state and renders the appropriate content panel.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SightingsTabs>;

export const WithContent: Story = {
  args: {
    pendingCount: 4,
    approvedCount: 12,
    deniedCount: 3,
    pendingContent: (
      <div className="space-y-3 p-4">
        {["Ratatouille — kitchen scene", "Mouse Hunt — opening credits", "Willard — final act"].map((label) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900">
            <p className="font-semibold text-stone-900 dark:text-stone-100">{label}</p>
            <p className="mt-1 text-sm text-stone-500">Submitted 2 hours ago · Pending review</p>
          </div>
        ))}
      </div>
    ),
    approvedContent: (
      <div className="p-4 text-sm text-stone-500 dark:text-stone-400">
        12 approved sightings — showing page 1 of 1.
      </div>
    ),
    deniedContent: (
      <div className="p-4 text-sm text-stone-500 dark:text-stone-400">
        3 denied sightings.
      </div>
    ),
  },
};

export const AllEmpty: Story = {
  args: {
    pendingCount: 0,
    approvedCount: 0,
    deniedCount: 0,
    pendingContent: <p className="p-6 text-sm text-stone-400">No pending submissions.</p>,
    approvedContent: <p className="p-6 text-sm text-stone-400">No approved sightings.</p>,
    deniedContent: <p className="p-6 text-sm text-stone-400">No denied sightings.</p>,
  },
};

export const HighPendingCount: Story = {
  args: {
    pendingCount: 23,
    approvedCount: 156,
    deniedCount: 41,
    pendingContent: <p className="p-6 text-sm text-stone-500">23 items awaiting review.</p>,
    approvedContent: <p className="p-6 text-sm text-stone-500">156 approved.</p>,
    deniedContent: <p className="p-6 text-sm text-stone-500">41 denied.</p>,
  },
};
