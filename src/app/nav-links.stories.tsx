import type { Meta, StoryObj } from "@storybook/react";
import type { ModeratorSession } from "@/lib/auth";
import { NavLinks } from "./nav-links";

const meta: Meta<typeof NavLinks> = {
  title: "App/NavLinks",
  component: NavLinks,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Navigation links rendered inside the masthead. Desktop: horizontal flex with optional moderator avatar. Mobile: hamburger menu with animated drawer. Active link is highlighted based on `usePathname()`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavLinks>;

const session: ModeratorSession = {
  id: "mod-1",
  username: "mod",
  name: "Alex",
  email: "alex@whererat.com",
  avatarUrl: "/favicon.svg",
  role: "moderator",
};

export const PublicNav: Story = {
  args: { session: undefined },
  render: (args) => (
    <div className="border-b-2 border-stone-200 bg-[var(--wr-header-bg)] px-6 py-3 dark:border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-sm font-bold text-stone-500">WhereRat</span>
        <NavLinks {...args} />
      </div>
    </div>
  ),
};

export const ModeratorNav: Story = {
  args: { session },
  render: (args) => (
    <div className="border-b-2 border-stone-200 bg-[var(--wr-header-bg)] px-6 py-3 dark:border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-sm font-bold text-stone-500">WhereRat</span>
        <NavLinks {...args} />
      </div>
    </div>
  ),
};
