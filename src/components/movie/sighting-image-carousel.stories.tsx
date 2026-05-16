import type { Meta, StoryObj } from "@storybook/react";
import { SightingImageCarousel } from "./sighting-image-carousel";

const meta: Meta<typeof SightingImageCarousel> = {
  title: "Components/Movie/SightingImageCarousel",
  component: SightingImageCarousel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Aspect-video image carousel with prev/next buttons, dot indicators, and keyboard/touch navigation. When `spoilerHidden=true` blurs all slides and shows a warning overlay.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SightingImageCarousel>;

const slides = [
  { url: "https://placehold.co/800x450/ea580c/fff?text=Slide+1", alt: "Remy in kitchen" },
  { url: "https://placehold.co/800x450/92400e/fff?text=Slide+2", alt: "Remy close-up" },
  { url: "https://placehold.co/800x450/1c1410/fff?text=Slide+3", alt: "Remy with book" },
  { url: "https://placehold.co/800x450/78716c/fff?text=Slide+4", alt: "Wide kitchen shot" },
];

export const SingleSlide: Story = {
  args: { slides: [slides[0]] },
};

export const TwoSlides: Story = {
  args: { slides: slides.slice(0, 2) },
};

export const FourSlides: Story = {
  args: { slides },
};

export const SpoilerHidden: Story = {
  args: {
    slides,
    spoilerHidden: true,
  },
};

export const WithClassName: Story = {
  args: {
    slides: slides.slice(0, 2),
    className: "rounded-2xl overflow-hidden",
  },
};
