import type { Meta, StoryObj } from "@storybook/react";
import { SightingImageUpload } from "./sighting-image-upload";

const meta: Meta<typeof SightingImageUpload> = {
  title: "Components/Forms/SightingImageUpload",
  component: SightingImageUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Multi-file image upload with drag-and-drop, previews, reordering, and removal. Used on the public submit form for up to five sighting stills.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SightingImageUpload>;

export const Empty: Story = {};
