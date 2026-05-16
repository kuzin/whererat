import type { Meta, StoryObj } from "@storybook/react";
import { ScrollToTop } from "./scroll-to-top";

const meta: Meta<typeof ScrollToTop> = {
  title: "Components/UI/ScrollToTop",
  component: ScrollToTop,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixed-position 'scroll to top' button that appears after scrolling past 400px. It lifts above the footer to avoid overlap. In this story the button is forced visible for preview.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ScrollToTop>;

export const Default: Story = {
  render: () => (
    <div className="relative" style={{ height: "100vh" }}>
      <p className="p-8 text-sm text-stone-500 dark:text-stone-400">
        Scroll down 400px on a real page to see this button appear. In this story it is shown via
        forced CSS override below.
      </p>
      <style>{`
        /* Force-show the button for story preview */
        button[aria-label="Scroll to top"] {
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateY(0) !important;
        }
      `}</style>
      <ScrollToTop />
    </div>
  ),
};
