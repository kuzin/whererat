import type { Meta, StoryObj } from "@storybook/react";
import {
  MovieSightingsSortControl,
  MovieSightingsPagingBar,
} from "./movie-sightings-toolbar";

const meta: Meta = {
  title: "Components/Movie/SightingsToolbar",
  parameters: {
    docs: {
      description: {
        component:
          "Sort control (select dropdown) and paging bar (prev/next + count) for the sightings list on a movie page.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const SortControl: Story = {
  render: () => (
    <MovieSightingsSortControl
      moviePath="/movies/ratatouille"
      sort="newest"
      palette={false}
      isSeries={false}
    />
  ),
};

export const SortControlSeries: Story = {
  render: () => (
    <MovieSightingsSortControl
      moviePath="/movies/stranger-things"
      sort="episode"
      palette={false}
      isSeries={true}
    />
  ),
};

export const PagingBarFirstPage: Story = {
  render: () => (
    <MovieSightingsPagingBar
      moviePath="/movies/ratatouille"
      sort="newest"
      safePage={1}
      pageCount={4}
      totalCount={38}
      palette={false}
      placement="top"
    />
  ),
};

export const PagingBarMiddlePage: Story = {
  render: () => (
    <MovieSightingsPagingBar
      moviePath="/movies/ratatouille"
      sort="newest"
      safePage={2}
      pageCount={4}
      totalCount={38}
      palette={false}
      placement="bottom"
    />
  ),
};

export const PagingBarLastPage: Story = {
  render: () => (
    <MovieSightingsPagingBar
      moviePath="/movies/ratatouille"
      sort="newest"
      safePage={4}
      pageCount={4}
      totalCount={38}
      palette={false}
    />
  ),
};

export const SortAndPaging: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <MovieSightingsSortControl
          moviePath="/movies/ratatouille"
          sort="newest"
          palette={false}
          isSeries={false}
        />
        <MovieSightingsPagingBar
          moviePath="/movies/ratatouille"
          sort="newest"
          safePage={2}
          pageCount={4}
          totalCount={38}
          palette={false}
          placement="top"
        />
      </div>
    </div>
  ),
};
