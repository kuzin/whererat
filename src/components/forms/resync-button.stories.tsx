import type { Meta, StoryObj } from "@storybook/react";
import { ResyncButton, ResyncMenuButton } from "./resync-button";

const meta: Meta = {
  title: "Components/Forms/ResyncButton",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "IMDb resync buttons that use `useFormStatus` to show a spinner while a server action is in flight. Must be rendered inside a `<form>` to receive the pending state. The static state is shown here since there is no pending server action in Storybook.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const IconButton: Story = {
  render: () => (
    <form>
      <ResyncButton />
    </form>
  ),
};

export const MenuButton: Story = {
  render: () => (
    <form>
      <ResyncMenuButton />
    </form>
  ),
};

export const BothVariants: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <form>
        <ResyncButton />
      </form>
      <div className="w-52 overflow-hidden rounded-xl border border-stone-900/12 bg-white py-1 shadow-md dark:border-white/10 dark:bg-stone-900">
        <form>
          <ResyncMenuButton />
        </form>
      </div>
    </div>
  ),
};
