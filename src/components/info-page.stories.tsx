import type { Meta, StoryObj } from "@storybook/react";
import {
  InfoPageShell,
  InfoHero,
  InfoSection,
  InfoNote,
  InfoCta,
  InfoFootnote,
  OM,
} from "./info-page";

const meta: Meta = {
  title: "Components/InfoPage",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Composable building blocks for static info pages (About, Guidelines, Privacy). InfoPageShell provides the two-column layout; InfoHero, InfoSection, InfoNote, InfoCta, and InfoFootnote are content slabs.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const FullPage: Story = {
  render: () => (
    <InfoPageShell
      hero={
        <InfoHero
          icon={<OM code="1F400" label="Rat" size={64} />}
          title="About WhereRat"
          description="A catalog of rat cameos in movies and TV. Submit a sighting, get credit when it's approved."
          cta={
            <a href="/submit" className="wr-btn-primary inline-block px-6 py-3">
              Submit a sighting
            </a>
          }
        />
      }
    >
      <InfoSection icon={<OM code="1F50D" label="Search" />} title="How it works">
        Users submit timestamped sightings with screenshots. Moderators review and approve them
        before they appear publicly in the catalog.
      </InfoSection>
      <InfoSection icon={<OM code="1F4F7" label="Camera" />} title="Screenshots">
        Attach up to four screenshots per sighting to help viewers find the exact moment.
      </InfoSection>
      <InfoNote>
        WhereRat is an independent fan project and is not affiliated with any film studio.
      </InfoNote>
      <InfoCta
        title="Know a rat cameo?"
        subtitle="Add it to the catalog — takes about 2 minutes."
        href="/submit"
        label="Submit a sighting"
      />
      <InfoFootnote>🐀 WHERE THE RAT AT 🐀</InfoFootnote>
    </InfoPageShell>
  ),
};

export const Hero: Story = {
  render: () => (
    <div className="p-8">
      <InfoHero
        icon={<OM code="1F400" label="Rat" size={56} />}
        title="About WhereRat"
        description="A catalog of rat cameos in movies and TV. Submit a sighting, get credit when it's approved."
        cta={
          <a href="/submit" className="wr-btn-primary inline-block px-6 py-3">
            Submit a sighting
          </a>
        }
      />
    </div>
  ),
};

export const Section: Story = {
  render: () => (
    <div className="max-w-lg p-8">
      <InfoSection icon={<OM code="1F50D" label="Search" />} title="How it works">
        Users submit timestamped sightings with screenshots. Moderators review and approve them
        before they appear publicly in the catalog.
      </InfoSection>
    </div>
  ),
};

export const CtaBanner: Story = {
  render: () => (
    <div className="max-w-lg p-8">
      <InfoCta
        title="Know a rat cameo?"
        subtitle="Add it to the catalog — takes about 2 minutes."
        href="/submit"
        label="Submit a sighting"
      />
    </div>
  ),
};

export const Note: Story = {
  render: () => (
    <div className="max-w-lg p-8">
      <InfoNote>
        WhereRat is an independent fan project and is not affiliated with any film studio or
        streaming platform. All trademarks belong to their respective owners.
      </InfoNote>
    </div>
  ),
};
