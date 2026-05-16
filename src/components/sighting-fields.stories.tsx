import type { Meta, StoryObj } from "@storybook/react";
import {
  SwarmSignal,
  SightingTimestampField,
  SightingRatCountField,
  SightingDescriptionField,
  SightingRodentTypesField,
  SightingContentWarningsField,
} from "./sighting-fields";

const meta: Meta = {
  title: "Components/SightingFields",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Form field components used in the sighting submission and edit forms. Each is individually exportable and composable.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// ─── SwarmSignal ─────────────────────────────────────────────────────────────

export const SwarmSignal1Rat: Story = {
  name: "SwarmSignal – 1 rat",
  render: () => <SwarmSignal count={1} openmojiCode="1F400" noun="Rat" />,
};

export const SwarmSignal3Rats: Story = {
  name: "SwarmSignal – 3 rats",
  render: () => <SwarmSignal count={3} openmojiCode="1F400" noun="Rat" />,
};

export const SwarmSignalMax: Story = {
  name: "SwarmSignal – 6+ rats",
  render: () => <SwarmSignal count={12} openmojiCode="1F400" noun="Rat" />,
};

// ─── Timestamp slider ────────────────────────────────────────────────────────

export const TimestampField: Story = {
  render: () => (
    <form className="max-w-sm space-y-4">
      <SightingTimestampField defaultValue={35} runtimeMinutes={100} />
    </form>
  ),
};

export const TimestampFieldNoRuntime: Story = {
  render: () => (
    <form className="max-w-sm">
      <SightingTimestampField defaultValue={60} />
    </form>
  ),
};

// ─── Rat count stepper ────────────────────────────────────────────────────────

export const RatCountField: Story = {
  render: () => (
    <form className="max-w-sm">
      <SightingRatCountField defaultValue={2} openmojiCode="1F400" noun="Rat" />
    </form>
  ),
};

export const MouseCountField: Story = {
  render: () => (
    <form className="max-w-sm">
      <SightingRatCountField
        defaultValue={1}
        openmojiCode="1F401"
        rodentId="mouse"
        noun="Mouse"
        label="Mice on screen"
      />
    </form>
  ),
};

// ─── Description textarea ────────────────────────────────────────────────────

export const DescriptionField: Story = {
  render: () => (
    <form className="max-w-lg">
      <SightingDescriptionField
        defaultValue="Remy scurries through the kitchen at the start of the cooking montage."
      />
    </form>
  ),
};

export const DescriptionFieldWithError: Story = {
  render: () => (
    <form className="max-w-lg">
      <SightingDescriptionField
        required
        errorMessage="Description is required."
        defaultValue=""
      />
    </form>
  ),
};

// ─── Rodent type picker ───────────────────────────────────────────────────────

export const RodentTypesField: Story = {
  render: () => (
    <form className="max-w-lg">
      <SightingRodentTypesField initialTypes={["rat"]} />
    </form>
  ),
};

export const RodentTypesOther: Story = {
  render: () => (
    <form className="max-w-lg">
      <SightingRodentTypesField initialTypes={["other"]} initialOtherLabel="Capybara" />
    </form>
  ),
};

// ─── Content warnings ────────────────────────────────────────────────────────

export const ContentWarningsField: Story = {
  render: () => (
    <form className="max-w-lg">
      <SightingContentWarningsField />
    </form>
  ),
};

export const ContentWarningsWithSelection: Story = {
  render: () => (
    <form className="max-w-lg">
      <SightingContentWarningsField initialWarnings={["rat-dies", "graphic"]} />
    </form>
  ),
};

export const ContentWarningsEmbedded: Story = {
  render: () => (
    <form className="max-w-lg rounded-xl border border-stone-200 p-4 dark:border-white/10">
      <p className="mb-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
        Content warnings (embedded, no outer border)
      </p>
      <SightingContentWarningsField embedded />
    </form>
  ),
};
