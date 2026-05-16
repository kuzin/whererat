import type { Meta, StoryObj } from "@storybook/react";
import { ResyncAllButton } from "./resync-all-button";

const meta: Meta<typeof ResyncAllButton> = {
  title: "Components/Moderation/ResyncAllButton",
  component: ResyncAllButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Submit button that resyncs all movie metadata. Uses useFormStatus to show a pending spinner; must be inside a <form>.",
      },
    },
  },
  decorators: [
    (Story) => (
      <form action={async () => {}}>
        <Story />
      </form>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ResyncAllButton>;

export const Default: Story = {};
