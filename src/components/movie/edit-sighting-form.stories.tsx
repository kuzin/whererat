import type { Meta, StoryObj } from "@storybook/react";
import type { Sighting } from "@/lib/whererat";
import { EditSightingForm } from "./edit-sighting-form";

const meta: Meta<typeof EditSightingForm> = {
  title: "Components/Movie/EditSightingForm",
  component: EditSightingForm,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Edit form for an existing approved sighting. Accepts server actions as props for update + delete.",
      },
    },
  },
  args: {
    slug: "ratatouille",
    returnTo: "/movies/ratatouille",
    isSeriesTitle: false,
    updateAction: async () => {},
    deleteAction: async () => {},
  },
};
export default meta;

type Story = StoryObj<typeof EditSightingForm>;

const baseSighting: Sighting = {
  id: "sight-1",
  movieId: "movie-ratatouille",
  timestamp: "38%",
  title: "Remy enters the kitchen",
  description: "Remy sneaks through the kitchen vent and lands on the countertop.",
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

export const Movie: Story = {
  args: { sighting: baseSighting },
};

export const SeriesEpisode: Story = {
  args: {
    sighting: {
      ...baseSighting,
      imdbKind: "series",
      seasonNumber: 2,
      episodeNumber: 5,
      episodeTitle: "City of Rats",
    },
    isSeriesTitle: true,
  },
};

export const Spoiler: Story = {
  args: {
    sighting: { ...baseSighting, spoiler: true, title: "The big reveal" },
  },
};

export const SwarmSighting: Story = {
  args: {
    sighting: {
      ...baseSighting,
      approximateRatCount: 15,
      contentWarnings: ["swarm"],
      title: "Rats pour out of the walls",
    },
  },
};

export const EmbeddedInModal: Story = {
  args: {
    sighting: baseSighting,
    formId: "edit-form-modal",
  },
};
