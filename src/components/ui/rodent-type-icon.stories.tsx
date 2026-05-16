import type { Meta, StoryObj } from "@storybook/react";
import { RodentTypeIcon } from "./rodent-type-icon";

const meta: Meta<typeof RodentTypeIcon> = {
  title: "Components/UI/RodentTypeIcon",
  component: RodentTypeIcon,
  tags: ["autodocs"],
  args: {
    openmojiCode: "1F400",
    label: "Rat",
    size: 32,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Renders an OpenMoji SVG for a rodent type. Some types share the same base emoji but use CSS filter overrides to differentiate them visually.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof RodentTypeIcon>;

export const Rat: Story = {
  args: { openmojiCode: "1F400", label: "Rat", rodentId: "rat" },
};

export const Mouse: Story = {
  args: { openmojiCode: "1F401", label: "Mouse", rodentId: "mouse" },
};

export const Squirrel: Story = {
  args: { openmojiCode: "1F43F", label: "Squirrel", rodentId: "squirrel" },
};

export const Hamster: Story = {
  args: { openmojiCode: "1F439", label: "Hamster", rodentId: "hamster" },
};

export const GuineaPig: Story = {
  args: { openmojiCode: "1F439", label: "Guinea pig", rodentId: "guinea-pig" },
};

export const Gerbil: Story = {
  args: { openmojiCode: "1F439", label: "Gerbil", rodentId: "gerbil" },
};

export const Beaver: Story = {
  args: { openmojiCode: "1F9AB", label: "Beaver", rodentId: "beaver" },
};

export const Chipmunk: Story = {
  args: { openmojiCode: "1F43F", label: "Chipmunk", rodentId: "chipmunk" },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {[
        { id: "rat", code: "1F400", label: "Rat" },
        { id: "mouse", code: "1F401", label: "Mouse" },
        { id: "squirrel", code: "1F43F", label: "Squirrel" },
        { id: "hamster", code: "1F439", label: "Hamster" },
        { id: "guinea-pig", code: "1F439", label: "Guinea pig" },
        { id: "gerbil", code: "1F439", label: "Gerbil" },
        { id: "beaver", code: "1F9AB", label: "Beaver" },
        { id: "chipmunk", code: "1F43F", label: "Chipmunk" },
      ].map(({ id, code, label }) => (
        <div key={id} className="flex flex-col items-center gap-1.5">
          <RodentTypeIcon
            openmojiCode={code}
            label={label}
            rodentId={id as Parameters<typeof RodentTypeIcon>[0]["rodentId"]}
            size={40}
          />
          <span className="text-xs text-stone-500 dark:text-stone-400">{label}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {[16, 24, 32, 48, 64].map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <RodentTypeIcon openmojiCode="1F400" label="Rat" rodentId="rat" size={size} />
          <span className="text-xs text-stone-500 dark:text-stone-400">{size}px</span>
        </div>
      ))}
    </div>
  ),
};
