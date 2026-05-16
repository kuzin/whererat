import type { Meta, StoryObj } from "@storybook/react";
import { AccentColorField } from "./accent-color-field";

const meta: Meta<typeof AccentColorField> = {
  title: "Components/Forms/AccentColorField",
  component: AccentColorField,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Color picker for movie accent color overrides. Clicking the swatch opens the native color picker; typing a hex edits it directly. Clearing resets to the auto-derived palette color. Submits via a hidden `overrideAccent` form field.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AccentColorField>;

export const NoOverride: Story = {
  args: {
    autoAccent: "#ea580c",
    currentOverride: "",
  },
};

export const WithOverride: Story = {
  args: {
    autoAccent: "#ea580c",
    currentOverride: "#6366f1",
  },
};

export const DarkAutoAccent: Story = {
  args: {
    autoAccent: "#0ea5e9",
    currentOverride: "",
  },
};
