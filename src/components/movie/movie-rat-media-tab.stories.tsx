import type { Meta, StoryObj } from "@storybook/react";
import type { ImdbImage, ImdbVideo } from "@/lib/whererat";
import { MovieRatMediaTab } from "./movie-rat-media-tab";

const meta: Meta<typeof MovieRatMediaTab> = {
  title: "Components/Movie/MovieRatMediaTab",
  component: MovieRatMediaTab,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Movie media tab with YouTube trailer embed, IMDb video clips, and image gallery. Clicking opens a lightbox modal.",
      },
    },
  },
  args: { palette: false },
};
export default meta;

type Story = StoryObj<typeof MovieRatMediaTab>;

const videos: ImdbVideo[] = [
  {
    id: "vi1",
    name: "Official trailer",
    contentType: "Trailer",
    thumbnailUrl: "https://placehold.co/640x360/ea580c/fff?text=Trailer",
    runtimeSeconds: 142,
  },
  {
    id: "vi2",
    name: "Kitchen scene clip",
    contentType: "Clip",
    thumbnailUrl: "https://placehold.co/640x360/92400e/fff?text=Clip",
    runtimeSeconds: 38,
  },
  {
    id: "vi3",
    name: "Behind the scenes",
    contentType: "Featurette",
    thumbnailUrl: "https://placehold.co/640x360/1c1410/fff?text=Featurette",
    runtimeSeconds: 240,
  },
];

const images: ImdbImage[] = [
  { id: "im1", url: "https://placehold.co/600x900/ea580c/fff?text=Still+1", width: 600, height: 900, caption: "Remy in kitchen" },
  { id: "im2", url: "https://placehold.co/900x600/92400e/fff?text=Still+2", width: 900, height: 600, caption: "Chef and rat" },
  { id: "im3", url: "https://placehold.co/600x600/78716c/fff?text=Still+3", width: 600, height: 600 },
  { id: "im4", url: "https://placehold.co/800x500/1c1410/fff?text=Still+4", width: 800, height: 500 },
];

export const Full: Story = {
  args: {
    videos,
    images,
    youtubeTrailerKey: "dQw4w9WgXcQ",
  },
};

export const ImagesOnly: Story = {
  args: {
    videos: [],
    images,
  },
};

export const VideosOnly: Story = {
  args: {
    videos,
    images: [],
  },
};

export const Empty: Story = {
  args: {
    videos: [],
    images: [],
  },
};
