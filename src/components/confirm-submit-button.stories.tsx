import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmSubmitButton } from "./confirm-submit-button";

const meta: Meta<typeof ConfirmSubmitButton> = {
  title: "Components/ConfirmSubmitButton",
  component: ConfirmSubmitButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A submit button that intercepts the click, shows an in-page confirmation modal, then allows the form to submit. Click the button in the canvas to see the confirmation dialog.",
      },
    },
  },
  args: {
    confirmMessage: "Are you sure you want to delete this sighting? This action cannot be undone.",
    children: "Delete sighting",
  },
};
export default meta;

type Story = StoryObj<typeof ConfirmSubmitButton>;

export const Default: Story = {
  args: {
    className: "wr-btn bg-red-100 text-red-900 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-100 px-5",
  },
  render: (args) => (
    <form action={() => alert("Submitted!")}>
      <ConfirmSubmitButton {...args} />
    </form>
  ),
};

export const AsIconButton: Story = {
  args: {
    confirmMessage: "Delete this item?",
    "aria-label": "Delete",
    title: "Delete",
    className:
      "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 border-red-700/30 bg-red-50/80 text-red-700 shadow-[2px_2px_0_0_rgb(185_28_28/0.28)] hover:bg-red-100 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-400",
  },
  render: (args) => (
    <form action={() => alert("Deleted!")}>
      <ConfirmSubmitButton {...args}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.559a.75.75 0 1 0-1.492.141l.66 6.9A1.75 1.75 0 0 0 5.405 15h5.19a1.75 1.75 0 0 0 1.741-1.4l.66-6.9a.75.75 0 0 0-1.492-.141l-.66 6.9a.25.25 0 0 1-.249.2h-5.19a.25.25 0 0 1-.249-.2Z" />
        </svg>
        <span className="sr-only">Delete</span>
      </ConfirmSubmitButton>
    </form>
  ),
};
