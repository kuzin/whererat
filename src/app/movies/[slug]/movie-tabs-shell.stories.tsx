import type { Meta, StoryObj } from "@storybook/react";
import { MovieTabsShell } from "./movie-tabs-shell";

const meta: Meta<typeof MovieTabsShell> = {
  title: "App/Movies/MovieTabsShell",
  component: MovieTabsShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Two-column movie page layout with folder-tab navigation. Desktop: sticky sidebar + tab panels. Mobile: dropdown select. Active tab is derived from `?tab=` URL param; falls back to tab[0].",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MovieTabsShell>;

const tabs = [
  { id: "sightings", label: "Sightings" },
  { id: "media", label: "Media" },
  { id: "related", label: "Related" },
];

const sidebar = (
  <div className="space-y-4">
    <img
      src="https://placehold.co/300x450/ea580c/fff?text=Poster"
      alt="Ratatouille poster"
      className="w-full rounded-xl"
    />
    <div className="rounded-xl border border-stone-200 p-4 dark:border-white/10">
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Ratatouille</p>
      <p className="text-xs text-stone-500">2007 · Animation</p>
    </div>
  </div>
);

export const Default: Story = {
  args: {
    tabs,
    palette: false,
    sidebarContent: sidebar,
    children: [
      <div key="sightings" className="space-y-3 py-4">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Sightings tab</p>
        <p className="text-sm text-stone-500">12 sightings for this title.</p>
      </div>,
      <div key="media" className="py-4">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Media tab</p>
        <p className="text-sm text-stone-500">IMDb clips and trailers.</p>
      </div>,
      <div key="related" className="py-4">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Related tab</p>
        <p className="text-sm text-stone-500">Similar rat titles.</p>
      </div>,
    ],
  },
};
