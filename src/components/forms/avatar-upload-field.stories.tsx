import type { Meta, StoryObj } from "@storybook/react";
import { AvatarUploadField } from "./avatar-upload-field";

const meta: Meta<typeof AvatarUploadField> = {
  title: "Components/Forms/AvatarUploadField",
  component: AvatarUploadField,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Avatar uploader with drag-and-drop, file picker, and live preview. Used on profile + moderator-user pages.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AvatarUploadField>;

export const Empty: Story = {
  args: {
    initialAvatarUrl: "",
    displayName: "Ratty McRatface",
  },
};

export const WithExisting: Story = {
  args: {
    initialAvatarUrl: "https://placehold.co/160x160/ea580c/fff?text=Avatar",
    displayName: "Remy",
  },
};
