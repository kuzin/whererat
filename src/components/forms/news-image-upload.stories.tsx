import type { Meta, StoryObj } from "@storybook/react";
import { NewsImageUpload } from "./news-image-upload";

const meta: Meta<typeof NewsImageUpload> = {
  title: "Components/Forms/NewsImageUpload",
  component: NewsImageUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Image picker for newsletter hero images with draggable focal-point and zoom. Used in compose-newsletter and news-edit flows.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NewsImageUpload>;

export const Empty: Story = {
  args: {},
};

export const WithImage: Story = {
  args: {
    initialImageUrl: "https://placehold.co/1200x600/ea580c/fff?text=Hero+Image",
    initialPositionX: 50,
    initialPositionY: 50,
    initialZoom: 1,
  },
};

export const Zoomed: Story = {
  args: {
    initialImageUrl: "https://placehold.co/1200x600/92400e/fff?text=Zoomed+Hero",
    initialPositionX: 30,
    initialPositionY: 70,
    initialZoom: 1.5,
  },
};
