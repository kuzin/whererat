import type { Meta, StoryObj } from "@storybook/react";
import { MovieSearchField } from "./movie-search-field";

const meta: Meta<typeof MovieSearchField> = {
  title: "Components/Forms/MovieSearchField",
  component: MovieSearchField,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Autocomplete search for movies/series. Hits /api/movies/search and shows a results dropdown with posters and metadata. Fires callbacks when the user selects a title or changes the IMDb kind.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MovieSearchField>;

export const Empty: Story = {
  args: {},
};

export const WithFieldErrors: Story = {
  args: {
    fieldErrors: {
      movieTitle: "Please pick a title from the suggestions",
    },
  },
};
