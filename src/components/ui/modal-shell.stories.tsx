import type { Meta, StoryObj } from "@storybook/react";
import { ModalShell } from "./modal-shell";

const meta: Meta<typeof ModalShell> = {
  title: "Components/UI/ModalShell",
  component: ModalShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-screen overlay modal with sticky header and footer. Used for edit and compose flows. The close button is a next/link — in stories it navigates to the provided closeHref.",
      },
    },
  },
  args: {
    title: "Edit sighting",
    closeHref: "#",
    footer: (
      <button type="button" className="wr-btn-primary px-6">
        Save changes
      </button>
    ),
    children: (
      <div className="space-y-4 py-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Description
          </label>
          <textarea
            rows={4}
            className="wr-input w-full resize-none py-3"
            placeholder="Describe the rat sighting…"
            defaultValue="Remy scurries through the kitchen in the opening scene."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Timestamp
          </label>
          <input type="text" className="wr-input w-full" defaultValue="00:03:12" />
        </div>
      </div>
    ),
  },
};
export default meta;

type Story = StoryObj<typeof ModalShell>;

export const Default: Story = {};

export const LongContent: Story = {
  args: {
    title: "Compose newsletter digest",
    children: (
      <div className="space-y-4 py-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-4 dark:border-white/10">
            <p className="font-semibold text-stone-900 dark:text-stone-100">
              Sighting #{i + 1}: Ratatouille
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Remy appears at 00:0{i + 1}:12 in the kitchen scene.
            </p>
          </div>
        ))}
      </div>
    ),
  },
};

export const Narrow: Story = {
  args: {
    containerClassName: "max-w-md bg-white dark:border-white/20 dark:bg-stone-900",
    title: "Confirm action",
    children: (
      <p className="py-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        Are you sure you want to delete this sighting? This action cannot be undone.
      </p>
    ),
    footer: (
      <>
        <a href="#" className="wr-btn-ghost px-5">
          Cancel
        </a>
        <button className="wr-btn bg-red-100 text-red-900 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-100 px-5">
          Delete
        </button>
      </>
    ),
  },
};
