import type { Metadata } from "next";
import { InfoPageShell, InfoHero, InfoSection, InfoCta, InfoFootnote, OM } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Submission Guidelines",
  description:
    "Read WhereRat submission guidelines for valid sightings, spoilers, moderation, accessibility, and sources.",
  alternates: {
    canonical: "/guidelines",
  },
};

const sections = [
  {
    icon: <OM code="1F400" label="Rat" size={28} />,
    title: "What counts as a sighting",
    body: "A valid sighting must have an actual on-screen rodent — live, dead, or animated — visible in the film frame. Background decorations, posters, stuffed animals, and metaphorical rodents don't count. A quick cameo still qualifies; the rodent just needs to be genuinely present on screen.",
  },
  {
    icon: <OM code="1F3AC" label="Clapperboard" size={28} />,
    title: "What to include",
    body: "Every submission needs a sighting title, an approximate point in the film (as a percentage), a short description, an approximate rodent count, and your display name. Contact email is optional and only used for moderator follow-up. Markdown formatting is welcome in descriptions — bold, italics, lists, and links all render. Use the preview on the submit form to check your formatting before submitting.",
  },
  {
    icon: <OM code="26A0" label="Warning" size={28} />,
    title: "Spoilers",
    body: "Mark a submission as a spoiler if the rodent appears during a major plot reveal, a character's death, the ending, or a punchline that depends entirely on surprise. When in doubt, mark it — readers can always choose to reveal spoilers themselves.",
  },
  {
    icon: <OM code="1F91D" label="Handshake" size={28} />,
    title: "Be inclusive and kind",
    body: "WhereRat is for everyone who loves film and rodents. Submissions, descriptions, and display names must not contain hate speech, slurs, harassment, or content that demeans any person or group based on race, gender, sexuality, religion, disability, or any other characteristic. Descriptions should focus on the rodent — keep it about the cinema.",
  },
  {
    icon: <OM code="267F" label="Accessibility" size={28} />,
    title: "Accessibility",
    body: "Write descriptions that work for everyone. Describe what is actually visible on screen so that sightings are useful to people who are blind or have low vision. Avoid descriptions that rely purely on visual cues like \"the rodent in the bottom left\" without additional context. Sighting titles should be meaningful, not just \"rat scene.\"",
  },
  {
    icon: <OM code="1F50E" label="Magnifying glass" size={28} />,
    title: "Sources and images",
    body: "Descriptions should be based on personal viewing. If referencing a timestamp or external source, note it briefly. Uploaded images should be your own screenshots. Avoid uploading copyrighted promotional stills, watermarked press images, or clips — a clean frame grab from your own copy of the film is fine.",
  },
  {
    icon: <OM code="1F9FE" label="Receipt" size={28} />,
    title: "Movie metadata",
    body: "Every movie must be matched to an IMDb title. WhereRat uses the IMDb ID to fetch posters, genres, runtimes, ratings, and release info through an approved data provider. If a movie isn't in the catalog yet, include the IMDb title ID in your submission and a moderator will add it.",
  },
  {
    icon: <OM code="1F6E1" label="Shield" size={28} />,
    title: "Moderation",
    body: "Moderators review all submissions before they appear publicly. They may approve, reject, or lightly edit a submission for clarity, formatting, or accuracy. Rejections are not personal — common reasons include no rodent on screen, duplicate sighting, or a description that needs more detail. You're welcome to resubmit with improvements.",
  },
  {
    icon: <OM code="1F6AB" label="No entry" size={28} />,
    title: "What will be rejected",
    body: "Submissions will be rejected for: no on-screen rodent, duplicate of an existing sighting, hate speech or discriminatory content, spam or promotional content, descriptions that are unintelligible or contain only a single word, and images that are clearly watermarked or from press kits.",
  },
];

export default function GuidelinesPage() {
  return (
    <InfoPageShell
      hero={
        <InfoHero
          icon={<OM code="1F4D6" label="Book" size={56} />}
          title="Guidelines"
          description="Standards for submissions, spoilers, moderation, inclusivity, and accessibility — so the catalog stays accurate, welcoming, and easy to trust."
        />
      }
    >
      {sections.map((s) => (
        <InfoSection key={s.title} icon={s.icon} title={s.title}>
          {s.body}
        </InfoSection>
      ))}

      <InfoCta
        title="Ready to submit a sighting?"
        subtitle="You know the rules — go log that sighting."
        href="/submit"
        label="Submit a sighting →"
      />

      <InfoFootnote>
        * rodents have seen more films than most critics and charge nothing for their opinions
        · they prefer the middle seat · their tiny claws make no noise during quiet scenes
        · they will eat your popcorn but only the unpopped kernels, out of respect
        · no rodent has ever spoiled an ending · they are, frankly, professionals
      </InfoFootnote>
    </InfoPageShell>
  );
}
