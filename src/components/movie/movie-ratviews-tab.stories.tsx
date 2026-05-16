import type { Meta, StoryObj } from "@storybook/react";
import type { ImdbReview } from "@/lib/whererat";
import { MovieRatviewsTab } from "./movie-ratviews-tab";

const meta: Meta<typeof MovieRatviewsTab> = {
  title: "Components/Movie/MovieRatviewsTab",
  component: MovieRatviewsTab,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "List of IMDb user reviews with optional rat-mention highlight, expandable summaries, and ratings.",
      },
    },
  },
  args: { palette: false },
};
export default meta;

type Story = StoryObj<typeof MovieRatviewsTab>;

const reviews: ImdbReview[] = [
  {
    id: "rev-1",
    author: "ratfan42",
    summary: "Remy steals every scene",
    text: "The little rat at the heart of this movie is so well-animated I forgot I was watching a cartoon. Every kitchen scene with him is gold. Highly recommend to anyone who loves food, Paris, or rodents (or all three).",
    rating: 10,
    date: "2007-08-12",
    mentionsRat: true,
  },
  {
    id: "rev-2",
    author: "filmcritic_99",
    summary: "Charming but predictable",
    text: "Pixar delivers another visually stunning film. The story beats are familiar but the execution is top-notch. Some scenes drag slightly in the second act, but the climax pays off.",
    rating: 7,
    date: "2007-07-29",
    mentionsRat: false,
  },
  {
    id: "rev-3",
    author: "kitchenfan",
    summary: "Best food movie ever?",
    text: "The way they animate the food in this movie is incredible. You can almost smell the ratatouille at the end.",
    rating: 9,
    date: "2008-01-04",
    mentionsRat: false,
  },
  {
    id: "rev-4",
    author: "skeptic22",
    summary: "Not for me",
    text: "I just couldn't get past the rats in a kitchen premise. Maybe if I were younger.",
    date: "2007-09-15",
    mentionsRat: true,
  },
];

export const Full: Story = {
  args: { reviews },
};

export const RatMentionsOnly: Story = {
  args: { reviews: reviews.filter((r) => r.mentionsRat) },
};

export const Empty: Story = {
  args: { reviews: [] },
};
