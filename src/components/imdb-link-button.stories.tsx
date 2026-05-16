import type { Meta, StoryObj } from "@storybook/react";
import { ImdbLinkButton } from "./imdb-link-button";

const meta: Meta<typeof ImdbLinkButton> = {
  title: "Components/ImdbLinkButton",
  component: ImdbLinkButton,
  tags: ["autodocs"],
  args: {
    href: "https://www.imdb.com/title/tt0382932/",
    label: "View Ratatouille on IMDb",
  },
  parameters: {
    docs: {
      description: {
        component: "Ghost button linking to an IMDb title or person page.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ImdbLinkButton>;

export const Default: Story = {};
