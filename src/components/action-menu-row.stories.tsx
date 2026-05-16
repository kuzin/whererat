import type { Meta, StoryObj } from "@storybook/react";
import { ActionMenuRow, type Action } from "./action-menu-row";

const meta: Meta<typeof ActionMenuRow> = {
  title: "Components/ActionMenuRow",
  component: ActionMenuRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Row of icon-only action buttons that auto-collapses to a '…' overflow menu when there are more actions than maxVisible. First (maxVisible - 1) stay inline; the rest move to a dropdown.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ActionMenuRow>;

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.559a.75.75 0 1 0-1.492.141l.66 6.9A1.75 1.75 0 0 0 5.405 15h5.19a1.75 1.75 0 0 0 1.741-1.4l.66-6.9a.75.75 0 0 0-1.492-.141l-.66 6.9a.25.25 0 0 1-.249.2h-5.19a.25.25 0 0 1-.249-.2Z" />
  </svg>
);

const twoActions: Action[] = [
  { key: "edit", kind: "link", href: "#edit", label: "Edit", icon: <EditIcon /> },
  { key: "copy", kind: "copy", url: "/movies/ratatouille", label: "Copy link", icon: <CopyIcon /> },
];

const fourActions: Action[] = [
  { key: "edit", kind: "link", href: "#edit", label: "Edit", icon: <EditIcon /> },
  { key: "copy", kind: "copy", url: "/movies/ratatouille", label: "Copy link", icon: <CopyIcon /> },
  {
    key: "delete",
    kind: "confirm-form",
    formAction: () => {},
    confirmMessage: "Are you sure you want to delete this sighting?",
    label: "Delete",
    icon: <TrashIcon />,
    danger: true,
  },
  {
    key: "archive",
    kind: "form",
    formAction: () => {},
    label: "Archive",
    icon: <EditIcon />,
  },
];

export const TwoActions: Story = {
  args: { actions: twoActions },
};

export const WithOverflow: Story = {
  args: { actions: fourActions, maxVisible: 2 },
};

export const AllInline: Story = {
  args: { actions: twoActions, maxVisible: 3 },
};

export const DangerAction: Story = {
  args: {
    actions: [
      {
        key: "delete",
        kind: "confirm-form",
        formAction: () => {},
        confirmMessage: "Are you sure you want to delete this?",
        label: "Delete",
        icon: <TrashIcon />,
        danger: true,
      },
    ],
  },
};

export const InACard: Story = {
  render: () => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900">
      <div>
        <p className="font-semibold text-stone-900 dark:text-stone-100">Ratatouille (2007)</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">3 sightings approved</p>
      </div>
      <ActionMenuRow actions={twoActions} />
    </div>
  ),
};
