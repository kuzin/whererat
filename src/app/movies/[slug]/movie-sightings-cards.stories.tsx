import type { Meta, StoryObj } from "@storybook/react";
import type { Sighting } from "@/lib/whererat";
import { MovieSightingsCards } from "./movie-sightings-cards";

const meta: Meta<typeof MovieSightingsCards> = {
  title: "App/Movies/MovieSightingsCards",
  component: MovieSightingsCards,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "List of sighting cards with spoiler toggle, image carousels, markdown descriptions, rodent-type chips, content-warning chips, rat-presence visual, and optional curator notes.",
      },
    },
  },
  args: {
    palette: false,
    spoilerCountMovie: 0,
    isSeries: false,
    canEditSightings: false,
  },
};
export default meta;

type Story = StoryObj<typeof MovieSightingsCards>;

const baseSighting: Sighting = {
  id: "sight-1",
  movieId: "movie-ratatouille",
  timestamp: "38%",
  title: "Remy enters the kitchen",
  description:
    "Remy sneaks through the kitchen vent and lands on the countertop, narrowly avoiding Chef Gusteau's brigade. The scene is played for comedy but the rat presence is unmistakable.",
  prominence: "background",
  sceneType: "live-action",
  spoiler: false,
  confidence: "verified",
  verificationState: "verified",
  verifiedBy: "seed",
  sourceIds: [],
  approximateRatCount: 1,
  rodentTypes: ["rat"],
};

const withImages: Sighting = {
  ...baseSighting,
  id: "sight-2",
  title: "Kitchen chase",
  timestamp: "52%",
  images: [
    { url: "https://placehold.co/800x450/ea580c/fff?text=Slide+1", alt: "Remy on countertop" },
    { url: "https://placehold.co/800x450/92400e/fff?text=Slide+2", alt: "Chef reacts" },
    { url: "https://placehold.co/800x450/1c1410/fff?text=Slide+3", alt: "Remy escapes" },
  ],
  approximateRatCount: 2,
  submitterName: "ratfan42",
};

const spoilerSighting: Sighting = {
  ...baseSighting,
  id: "sight-3",
  title: "The big reveal",
  timestamp: "78%",
  description:
    "The identity behind the cooking is finally exposed to the restaurant guests and food critics. Spoiler territory — major plot point.",
  spoiler: true,
  images: [
    { url: "https://placehold.co/800x450/1c1917/fff?text=Spoiler", alt: "Reveal scene" },
  ],
  approximateRatCount: 1,
};

const curatorNoteSighting: Sighting = {
  ...baseSighting,
  id: "sight-4",
  title: "Swarm in the walls",
  timestamp: "21%",
  description: "Dozens of rats pour out of the ceiling after Remy's family is discovered hiding in the kitchen.",
  approximateRatCount: 15,
  rodentTypes: ["rat"],
  contentWarnings: ["swarm"],
  curatorNote: "This scene was the inspiration for the site — the density here is unmatched in any other movie.",
};

const seriesSighting: Sighting = {
  ...baseSighting,
  id: "sight-5",
  title: "The pizza rat cameo",
  timestamp: "14%",
  description: "A rat drags a pizza slice down a flight of stairs in a clear homage to the famous viral video.",
  imdbKind: "series",
  seasonNumber: 2,
  episodeNumber: 5,
  episodeTitle: "City of Rats",
  approximateRatCount: 1,
  rodentTypes: ["rat"],
};

const mouseSighting: Sighting = {
  ...baseSighting,
  id: "sight-6",
  title: "Mouse in the pantry",
  timestamp: "8%",
  description: "A small mouse scurries across the pantry shelf before the main characters notice.",
  rodentTypes: ["mouse"],
  approximateRatCount: 1,
};

export const SingleSighting: Story = {
  args: {
    items: [baseSighting],
    spoilerCountMovie: 0,
  },
};

export const MultipleSightings: Story = {
  args: {
    items: [baseSighting, withImages, curatorNoteSighting],
    spoilerCountMovie: 0,
  },
};

export const WithImages: Story = {
  args: {
    items: [withImages],
    spoilerCountMovie: 0,
  },
};

export const WithSpoilerToggle: Story = {
  args: {
    items: [baseSighting, spoilerSighting],
    spoilerCountMovie: 1,
  },
};

export const WithCuratorNote: Story = {
  args: {
    items: [curatorNoteSighting],
    spoilerCountMovie: 0,
  },
};

export const SeriesEpisode: Story = {
  args: {
    items: [seriesSighting],
    spoilerCountMovie: 0,
    isSeries: true,
  },
};

export const MultipleRodentTypes: Story = {
  args: {
    items: [baseSighting, mouseSighting],
    spoilerCountMovie: 0,
  },
};

export const WithEditButton: Story = {
  args: {
    items: [baseSighting],
    spoilerCountMovie: 0,
    canEditSightings: true,
    editBasePath: "/movies/ratatouille",
  },
};

export const EmptySightings: Story = {
  args: {
    items: [],
    spoilerCountMovie: 0,
  },
};
