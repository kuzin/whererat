import type { Meta, StoryObj } from "@storybook/react";
import { CaitlinEasterEggToggle } from "./caitlin-easter-egg-toggle";

const meta: Meta<typeof CaitlinEasterEggToggle> = {
  title: "Components/Dev/CaitlinEasterEggToggle",
  component: CaitlinEasterEggToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Light/dark mode toggle embedded in the masthead. Reads initial state from localStorage and system preferences. Note: this component writes to `document.documentElement` directly — in Storybook it competes with the Theme toolbar for dark mode control.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof CaitlinEasterEggToggle>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "Toggle theme" },
};

export const WithClassName: Story = {
  args: { className: "shrink-0" },
};
