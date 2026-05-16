import type { Meta, StoryObj } from "@storybook/react";
import type { ImdbRelatedTitle } from "@/lib/whererat";
import { MovieRatlatedTab } from "./movie-ratlated-tab";

const meta: Meta<typeof MovieRatlatedTab> = {
  title: "Components/Movie/MovieRatlatedTab",
  component: MovieRatlatedTab,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Grid of related/similar IMDb titles with posters, year, and rating. Empty state when none.",
      },
    },
  },
  args: { palette: false },
};
export default meta;

type Story = StoryObj<typeof MovieRatlatedTab>;

const titles: ImdbRelatedTitle[] = [
  { id: "tt0382932", title: "Ratatouille", year: 2007, posterUrl: "https://placehold.co/300x450/ea580c/fff?text=Ratatouille", rating: 8.1 },
  { id: "tt0118786", title: "Mouse Hunt", year: 1997, posterUrl: "https://placehold.co/300x450/92400e/fff?text=Mouse+Hunt", rating: 6.4 },
  { id: "tt0319262", title: "Willard", year: 2003, posterUrl: "https://placehold.co/300x450/1c1410/fff?text=Willard", rating: 6.2 },
  { id: "tt0068473", title: "Ben", year: 1972, posterUrl: "https://placehold.co/300x450/78716c/fff?text=Ben", rating: 5.6 },
  { id: "tt0096446", title: "Lady and the Tramp", year: 1955, rating: 7.3 },
];

export const Full: Story = {
  args: { titles },
};

export const FewItems: Story = {
  args: { titles: titles.slice(0, 2) },
};

export const Empty: Story = {
  args: { titles: [] },
};
