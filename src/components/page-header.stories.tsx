import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./page-header";

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.559a.75.75 0 1 0-1.492.141l.66 6.9A1.75 1.75 0 0 0 5.405 15h5.19a1.75 1.75 0 0 0 1.741-1.4l.66-6.9a.75.75 0 0 0-1.492-.141l-.66 6.9a.25.25 0 0 1-.249.2h-5.19a.25.25 0 0 1-.249-.2Z" />
  </svg>
);

const meta: Meta<typeof PageHeader> = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shared page-level header bar: back chevron, optional title, ActionMenuRow actions (with auto-overflow), and an always-visible primary action button. Used on /movies/[slug], /moderation/news, /moderation/users.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PageHeader>;

export const BackOnly: Story = {
  args: {
    back: { href: "/", label: "Catalog" },
  },
};

export const BackWithTitle: Story = {
  args: {
    back: { href: "/moderation", label: "Moderation" },
    title: "Ratatouille (2007)",
  },
};

export const WithActions: Story = {
  args: {
    back: { href: "/moderation", label: "Moderation" },
    title: "Ratatouille (2007)",
    actions: [
      { key: "edit", kind: "link", href: "#edit", label: "Edit movie", icon: <EditIcon /> },
      {
        key: "delete",
        kind: "confirm-form",
        formAction: () => {},
        confirmMessage: "Are you sure you want to delete this movie?",
        label: "Delete movie",
        icon: <TrashIcon />,
        danger: true,
      },
    ],
  },
};

export const WithPrimaryAction: Story = {
  args: {
    back: { href: "/moderation/news", label: "News" },
    title: "News",
    primaryAction: {
      href: "#new",
      label: "New post",
      icon: <PlusIcon />,
    },
  },
};

export const FullConfiguration: Story = {
  args: {
    back: { href: "/moderation", label: "Moderation" },
    title: "Ratatouille (2007)",
    actions: [
      { key: "edit", kind: "link", href: "#edit", label: "Edit movie", icon: <EditIcon /> },
      {
        key: "delete",
        kind: "confirm-form",
        formAction: () => {},
        confirmMessage: "Delete this movie?",
        label: "Delete",
        icon: <TrashIcon />,
        danger: true,
      },
    ],
    primaryAction: {
      href: "#add",
      label: "Add sighting",
      icon: <PlusIcon />,
    },
  },
};

export const NoBackLink: Story = {
  args: {
    title: "Movie catalog",
    primaryAction: {
      href: "#new",
      label: "New post",
      icon: <PlusIcon />,
    },
  },
};
