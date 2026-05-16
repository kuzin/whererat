import type { Meta, StoryObj } from "@storybook/react";
import { SightingMarkdown } from "./sighting-markdown";

const meta: Meta<typeof SightingMarkdown> = {
  title: "Components/UI/SightingMarkdown",
  component: SightingMarkdown,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Renders user-submitted markdown for sighting descriptions. Uses react-markdown with remark-gfm. Styling uses --movie-accent for link colors when set.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SightingMarkdown>;

export const SimpleText: Story = {
  args: {
    markdown:
      "A rat scurries across the kitchen floor in the opening scene, establishing the film's Parisian setting.",
  },
};

export const WithFormatting: Story = {
  args: {
    markdown: `Remy appears **prominently** in this scene, and his presence is *crucial* to the plot.

The sequence lasts approximately 3 minutes and features:

- Close-up shots of Remy's face
- A chase through the restaurant kitchen
- Dialogue references to rats as "vermin"

> "If you are what you eat, then I only want to eat the good stuff." — Remy`,
  },
};

export const RichContent: Story = {
  args: {
    markdown: `## First Appearance

Remy is seen in the opening minutes crawling through Gusteau's kitchen.

### Details

The sequence includes:

1. Remy sniffing around the pantry
2. A near-miss with Linguini
3. The iconic "anyone can cook" realization

#### Timestamps

| Timestamp | Description |
|-----------|-------------|
| 0:03:12   | First glimpse |
| 0:03:45   | Close-up on Remy |
| 0:04:02   | Remy discovers the cookbook |

---

For more context, see the [Ratatouille wiki](https://pixar.fandom.com/wiki/Remy).

\`\`\`
# Technical note
Shot on ARRI camera, practical lighting
\`\`\``,
  },
};

export const ShortNote: Story = {
  args: {
    markdown: "Blink and you'll miss it — a toy rat in the background of the bedroom scene.",
  },
};

export const WithCode: Story = {
  args: {
    markdown: `The rat model used in this film was nicknamed \`RatV3\` internally.

\`\`\`
Production notes:
- 97,000 individual hairs simulated
- 1.2M render hours total
\`\`\``,
  },
};
