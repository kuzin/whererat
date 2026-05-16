import type { Meta, StoryObj } from "@storybook/react";
import { NewsBodyEditor } from "./news-body-editor";

const meta: Meta<typeof NewsBodyEditor> = {
  title: "Components/Forms/NewsBodyEditor",
  component: NewsBodyEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Markdown editor with a formatting toolbar (bold, italic, link, list, heading). Plain textarea + button row — no live preview.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NewsBodyEditor>;

export const Empty: Story = {
  args: {},
};

export const WithDefaultText: Story = {
  args: {
    defaultValue:
      "## What's new\n\nWe've added a **weekly digest** email so you never miss a new rat sighting.\n\n- Opt in from your account settings\n- Unsubscribe any time\n- First issue drops Friday",
  },
};
