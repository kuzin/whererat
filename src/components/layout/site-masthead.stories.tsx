import type { Meta, StoryObj } from "@storybook/react";
import type { ModeratorSession } from "@/lib/auth";
import { SiteMasthead } from "./site-masthead";

const meta: Meta<typeof SiteMasthead> = {
  title: "Components/Layout/SiteMasthead",
  component: SiteMasthead,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sticky top navigation bar. Contains the WhereRat wordmark logo (CSS-masked SVG), the Caitlin dark-mode easter-egg toggle, and NavLinks (Browse, News, Moderate, Submit + optional avatar). Brand SVG fills are controlled by `--wr-brand-mark` / `--wr-brand-wordmark` CSS vars in globals.css.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SiteMasthead>;

const moderatorSession: ModeratorSession = {
  id: "mod-1",
  username: "moderator",
  name: "Alex Moderator",
  email: "alex@whererat.com",
  avatarUrl: "/favicon.svg",
  role: "moderator",
};

export const PublicVisitor: Story = {
  args: { session: undefined },
};

export const LoggedInModerator: Story = {
  args: { session: moderatorSession },
};

export const Owner: Story = {
  args: {
    session: { ...moderatorSession, role: "owner" },
  },
};
