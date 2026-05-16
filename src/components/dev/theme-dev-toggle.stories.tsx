import type { Meta, StoryObj } from "@storybook/react";
import { ThemeDevToggle } from "./theme-dev-toggle";

const meta: Meta<typeof ThemeDevToggle> = {
  title: "Components/Dev/ThemeDevToggle",
  component: ThemeDevToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Dev-only light/dark switcher. Reads/writes the `whererat-theme` localStorage key and toggles the `.dark` class on `<html>`. Currently unwired in the app but available for ad-hoc testing.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ThemeDevToggle>;

export const Default: Story = {};

export const WithClassName: Story = {
  args: { className: "border border-stone-300 rounded-md p-2" },
};
