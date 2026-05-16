import type { Meta, StoryObj } from "@storybook/react";
import type { Submission } from "@/lib/whererat";
import { HistoryList } from "./history-list";

const meta: Meta<typeof HistoryList> = {
  title: "App/Moderation/HistoryList",
  component: HistoryList,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Paginated list of HistoryCard components (20 per page). Shows empty-state copy when no items. Prev/next page buttons rendered when there are more than 20 items.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HistoryList>;

const movies = [
  { title: "Ratatouille", year: 2007 },
  { title: "Mouse Hunt", year: 1997 },
  { title: "Willard", year: 2003 },
  { title: "Ben", year: 1972 },
  { title: "Nutcracker Fantasy", year: 1979 },
];

function makeSubmission(i: number): { submission: Submission; reviewerName: string; viewHref: string } {
  const movie = movies[i % movies.length];
  return {
    submission: {
      id: `sub-${i}`,
      movieTitle: movie.title,
      movieYear: movie.year,
      timestamp: `${20 + i * 7}%`,
      title: `Sighting ${i + 1}`,
      description: `A rat appears briefly in the scene. Very exciting moment captured on film.`,
      spoiler: i % 4 === 0,
      approximateRatCount: (i % 3) + 1,
      status: "approved",
      submittedBy: `user_${i}`,
      submittedAt: new Date(Date.now() - i * 86400000),
      rodentTypes: ["rat"],
    },
    reviewerName: ["Alex", "Jamie", "Sam"][i % 3],
    viewHref: `/movies/${movie.title.toLowerCase().replace(" ", "-")}`,
  };
}

export const FewItems: Story = {
  args: {
    mode: "approved",
    items: Array.from({ length: 3 }, (_, i) => makeSubmission(i)),
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};

export const ManyItems: Story = {
  args: {
    mode: "approved",
    items: Array.from({ length: 25 }, (_, i) => makeSubmission(i)),
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};

export const EmptyApproved: Story = {
  args: {
    mode: "approved",
    items: [],
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};

export const DeniedList: Story = {
  args: {
    mode: "denied",
    items: Array.from({ length: 5 }, (_, i) => ({
      ...makeSubmission(i),
      submission: { ...makeSubmission(i).submission, status: "rejected" as const },
    })),
    rereviewAction: async () => {},
    removeAction: async () => {},
  },
};
