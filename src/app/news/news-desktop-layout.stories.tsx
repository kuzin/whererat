import type { Meta, StoryObj } from "@storybook/react";
import type { NewsItem } from "@/lib/news-store";
import { NewsDesktopLayout } from "./news-desktop-layout";

const meta: Meta<typeof NewsDesktopLayout> = {
  title: "App/News/NewsDesktopLayout",
  component: NewsDesktopLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Desktop-only (lg+) two-pane layout: sticky sidebar nav with scroll-spy active state, and a scrollable article feed. Hidden below lg breakpoint — resize the canvas to 1024px+ to see it.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NewsDesktopLayout>;

function makeItem(overrides: Partial<NewsItem>): NewsItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    title: "Untitled",
    body: "Body copy goes here.",
    type: "update",
    imageUrl: null,
    imageAlt: null,
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
    authorId: "author-1",
    authorName: "The WhereRat team",
    authorAvatarUrl: "/brand/rat.svg",
    publishedAt: new Date("2025-05-01T12:00:00Z"),
    createdAt: new Date("2025-05-01T08:00:00Z"),
    updatedAt: new Date("2025-05-01T08:00:00Z"),
    ...overrides,
  };
}

const items: NewsItem[] = [
  makeItem({
    id: "item-1",
    type: "announcement",
    title: "WhereRat is now in open beta",
    publishedAt: new Date("2025-05-10T12:00:00Z"),
    body: "## Open beta\n\nAfter months of internal testing, WhereRat is opening to the public. Submit a sighting, vote on your favourites, and help us catalog every rat cameo in cinema history.\n\nWe've started with **over 200 verified sightings** across 80 titles. The mobile app is coming soon.",
  }),
  makeItem({
    id: "item-2",
    type: "product-news",
    title: "Newsletter digest is live",
    publishedAt: new Date("2025-05-08T12:00:00Z"),
    body: "You can now subscribe to a **weekly digest** email summarising new rat sightings and site updates. Opt in from your account settings page.\n\nUnsubscribe any time via the one-click link in every email footer.",
  }),
  makeItem({
    id: "item-3",
    type: "community",
    title: "Community spotlight: top submitters of April",
    publishedAt: new Date("2025-04-30T12:00:00Z"),
    body: "This month's **top contributors** each submitted more than 10 verified sightings:\n\n- **ratfan42** — 14 sightings\n- **squeaky_wheel** — 12 sightings\n- **ben_1972** — 11 sightings\n\nThank you all for helping grow the catalog!",
  }),
  makeItem({
    id: "item-4",
    type: "update",
    title: "Bug fixes: spoilers, pagination, dark mode",
    publishedAt: new Date("2025-04-22T12:00:00Z"),
    body: "Small housekeeping release:\n\n- Fixed spoiler toggle resetting on page navigation\n- Corrected episode sort order for multi-season series\n- Improved dark mode contrast on content-warning chips",
  }),
];

export const SingleItem: Story = {
  args: {
    items: items.slice(0, 1),
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Story />
      </div>
    ),
  ],
};

export const MultipleItems: Story = {
  args: {
    items,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Story />
      </div>
    ),
  ],
};

export const InitialActiveSet: Story = {
  args: {
    items,
    initialId: "item-3",
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Story />
      </div>
    ),
  ],
};
