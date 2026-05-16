import type { Meta, StoryObj } from "@storybook/react";
import type { NewsItem, NewsItemType } from "@/lib/news-store";
import { ArticleView, TypeChip } from "./article-view";

const meta: Meta = {
  title: "App/News/ArticleView",
  parameters: {
    docs: {
      description: {
        component:
          "Full article view with optional hero image, type chip, date, title, markdown body, and author footer. Also exports TypeChip for use in nav/lists.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function makeItem(overrides: Partial<NewsItem> & { type: NewsItemType }): NewsItem {
  return {
    id: "item-1",
    title: "WhereRat launches newsletter digest",
    body: "## What's new\n\nWe've added a **weekly digest** email so you never miss a new rat sighting.\n\n- Opt in from your account settings\n- Unsubscribe any time via the link in the footer\n- First issue drops Friday\n\nHappy sighting!",
    imageUrl: null,
    imageAlt: null,
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
    authorId: "author-1",
    authorName: "The WhereRat team",
    authorAvatarUrl: "/brand/rat.svg",
    publishedAt: new Date("2025-05-10T12:00:00Z"),
    createdAt: new Date("2025-05-09T08:00:00Z"),
    updatedAt: new Date("2025-05-10T11:00:00Z"),
    ...overrides,
  };
}

export const Announcement: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ArticleView item={makeItem({ type: "announcement", title: "WhereRat is now in open beta" })} />
    </div>
  ),
};

export const ProductNews: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ArticleView
        item={makeItem({
          type: "product-news",
          title: "New: newsletter digest",
          body: "We've added a **weekly digest** email. Opt in from your profile page.",
        })}
      />
    </div>
  ),
};

export const Community: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ArticleView
        item={makeItem({
          type: "community",
          title: "Community spotlight: top submitters of April",
          body: "This month's top contributors each submitted more than 10 verified sightings. Thanks to **ratfan42**, **squeaky_wheel**, and **ben_1972** for their dedication!",
        })}
      />
    </div>
  ),
};

export const Update: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ArticleView
        item={makeItem({
          type: "update",
          title: "Small fixes and improvements",
          body: "- Fixed spoiler toggle reset on page navigation\n- Improved mobile pagination bar spacing\n- Corrected episode sort order for multi-season series",
        })}
      />
    </div>
  ),
};

export const WithHeroImage: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ArticleView
        item={makeItem({
          type: "announcement",
          title: "WhereRat redesign is live",
          imageUrl: "https://placehold.co/1000x400/ea580c/fff?text=Hero+Image",
          imageAlt: "Remy the rat looks out over Paris",
          imagePositionX: 50,
          imagePositionY: 40,
          imageZoom: 1,
        })}
      />
    </div>
  ),
};

export const AllTypeChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-4">
      {(["announcement", "product-news", "community", "update"] as NewsItemType[]).map((t) => (
        <TypeChip key={t} type={t} />
      ))}
    </div>
  ),
};
