import type { Meta, StoryObj } from "@storybook/react";
import { InlineApproveForm } from "./inline-approve-form";

const meta: Meta<typeof InlineApproveForm> = {
  title: "App/Moderation/InlineApproveForm",
  component: InlineApproveForm,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Curator-note textarea + three action buttons (Edit / Approve / Deny) for the moderation queue. Submits via a server action passed as `moderateAction`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof InlineApproveForm>;

export const Default: Story = {
  args: {
    submissionId: "sub-001",
    editHref: "#edit",
    moderateAction: async () => {
      console.log("moderateAction called");
    },
  },
};
