import type { Meta, StoryObj } from "@storybook/react";
import type { Submission } from "@/lib/whererat";
import { HistoryCard } from "./history-card";

const meta: Meta<typeof HistoryCard> = {
  title: "App/Moderation/HistoryCard",
  component: HistoryCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Collapsible card for a reviewed submission in the moderation history. Click the row to expand the full description and action buttons (View, Edit, Re-review, Delete).",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HistoryCard>;

const baseSubmission: Submission = {
  id: "sub-001",
  movieTitle: "Ratatouille",
  movieYear: 2007,
  imdbId: "tt0382932",
  timestamp: "18%",
  title: "Remy in the kitchen",
  description:
    "Remy scurries through Gusteau's kitchen in the opening sequence, establishing him as a culinary prodigy before any of the human characters appear.\n\nThis is arguably the most iconic rat moment in cinema.",
  spoiler: false,
  approximateRatCount: 1,
  status: "approved",
  submittedBy: "rat_fan_99",
  submittedAt: new Date("2024-03-01T14:23:00Z"),
  rodentTypes: ["rat"],
};

const withImages: Submission = {
  ...baseSubmission,
  id: "sub-002",
  images: [
    { url: "https://placehold.co/800x450/ea580c/fff?text=Remy+kitchen", alt: "Remy in kitchen" },
    { url: "https://placehold.co/800x450/92400e/fff?text=Close-up", alt: "Close-up" },
  ],
};

const seriesSubmission: Submission = {
  ...baseSubmission,
  id: "sub-003",
  movieTitle: "Stranger Things",
  movieYear: 2016,
  imdbId: "tt4574334",
  imdbKind: "series",
  seasonNumber: 2,
  episodeNumber: 3,
  episodeTitle: "The Pollywog",
  timestamp: "42%",
  title: "Lab rat escape",
  description: "A lab rat escapes its cage in the Hawkins Lab background shot.",
  contentWarnings: ["rat-harmed"],
};

const deniedSubmission: Submission = {
  ...baseSubmission,
  id: "sub-004",
  status: "rejected",
  title: "Questionable sighting",
  description: "The submitter claimed there was a rat at 1:02:00 but the screenshot shows a cat.",
};

export const ApprovedCard: Story = {
  args: {
    submission: baseSubmission,
    historyTab: "approved",
    reviewerName: "Alex",
    viewHref: "/movies/ratatouille",
    returnTo: "/moderation",
    rereviewAction: async () => console.log("re-review"),
    removeAction: async () => console.log("remove"),
  },
};

export const WithImages: Story = {
  args: {
    submission: withImages,
    historyTab: "approved",
    reviewerName: "Alex",
    viewHref: "/movies/ratatouille",
    returnTo: "/moderation",
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};

export const SeriesEpisode: Story = {
  args: {
    submission: seriesSubmission,
    historyTab: "approved",
    reviewerName: "Jamie",
    returnTo: "/moderation",
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};

export const DeniedCard: Story = {
  args: {
    submission: deniedSubmission,
    historyTab: "denied",
    reviewerName: "Alex",
    returnTo: "/moderation",
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};

export const NoReviewer: Story = {
  args: {
    submission: baseSubmission,
    historyTab: "approved",
    returnTo: "/moderation",
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};
