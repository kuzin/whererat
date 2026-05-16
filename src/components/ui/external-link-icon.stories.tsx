import type { Meta, StoryObj } from "@storybook/react";
import { ExternalLinkIcon } from "./external-link-icon";

const meta: Meta<typeof ExternalLinkIcon> = {
  title: "Components/UI/ExternalLinkIcon",
  component: ExternalLinkIcon,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Small inline SVG used to indicate links that open in a new tab.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ExternalLinkIcon>;

export const Default: Story = {};

export const Large: Story = {
  args: { className: "size-6" },
};

export const Small: Story = {
  args: { className: "size-3" },
};

export const InlineWithText: Story = {
  render: () => (
    <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 underline">
      View on IMDb <ExternalLinkIcon />
    </a>
  ),
};
