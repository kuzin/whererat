import type { Meta, StoryObj } from "@storybook/react";
import { SubmissionImageThumbs } from "./submission-image-thumbs";

const meta: Meta<typeof SubmissionImageThumbs> = {
  title: "Components/SubmissionImageThumbs",
  component: SubmissionImageThumbs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Thumbnail strip for moderator review. Click a thumb to open a full-screen lightbox with keyboard (arrows / Escape) and touch-swipe navigation.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SubmissionImageThumbs>;

const slides = [
  { url: "https://placehold.co/800x450/ea580c/fff?text=Sighting+1", alt: "Remy in the kitchen" },
  { url: "https://placehold.co/800x450/92400e/fff?text=Sighting+2", alt: "Close-up on Remy" },
  { url: "https://placehold.co/800x450/1c1410/fff?text=Sighting+3", alt: "Remy with cookbook" },
];

export const SingleImage: Story = {
  args: { slides: [slides[0]] },
};

export const TwoImages: Story = {
  args: { slides: slides.slice(0, 2) },
};

export const ThreeImages: Story = {
  args: { slides },
};

export const NoImages: Story = {
  args: { slides: [] },
};
