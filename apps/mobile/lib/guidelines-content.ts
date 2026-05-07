export type GuidelinesSection = {
  icon: string;
  title: string;
  body: string;
};

/** Mirrors `/guidelines` on the web catalog. */
export const GUIDELINES_SECTIONS: GuidelinesSection[] = [
  {
    icon: "🐀",
    title: "What counts as a sighting",
    body: "A valid sighting must have an actual on-screen rat — live, dead, or animated — visible in the film frame. Background decorations, posters, stuffed animals, and metaphorical rats don't count. A quick cameo still qualifies; the rat just needs to be genuinely present on screen.",
  },
  {
    icon: "🎬",
    title: "What to include",
    body: "Every submission needs a sighting title, an approximate point in the film (as a percentage), a short description, an approximate rat count, and your display name. Contact email is optional and only used for moderator follow-up. Markdown formatting is welcome in descriptions — bold, italics, lists, and links all render. Use the preview on the submit form to check your formatting before submitting.",
  },
  {
    icon: "⚠️",
    title: "Spoilers",
    body: "Mark a submission as a spoiler if the rat appears during a major plot reveal, a character's death, the ending, or a punchline that depends entirely on surprise. When in doubt, mark it — readers can always choose to reveal spoilers themselves.",
  },
  {
    icon: "🤝",
    title: "Be inclusive and kind",
    body: "WhereRat is for everyone who loves film and rats. Submissions, descriptions, and display names must not contain hate speech, slurs, harassment, or content that demeans any person or group based on race, gender, sexuality, religion, disability, or any other characteristic. Descriptions should focus on the rat — keep it about the cinema.",
  },
  {
    icon: "♿",
    title: "Accessibility",
    body: 'Write descriptions that work for everyone. Describe what is actually visible on screen so that sightings are useful to people who are blind or have low vision. Avoid descriptions that rely purely on visual cues like "the rat in the bottom left" without additional context. Sighting titles should be meaningful, not just "rat scene."',
  },
  {
    icon: "🔎",
    title: "Sources and images",
    body: "Descriptions should be based on personal viewing. If referencing a timestamp or external source, note it briefly. Uploaded images should be your own screenshots. Avoid uploading copyrighted promotional stills, watermarked press images, or clips — a clean frame grab from your own copy of the film is fine.",
  },
  {
    icon: "🧾",
    title: "Movie metadata",
    body: "Every movie must be matched to an IMDb title. WhereRat uses the IMDb ID to fetch posters, genres, runtimes, ratings, and release info through an approved data provider. If a movie isn't in the catalog yet, include the IMDb title ID in your submission and a moderator will add it.",
  },
  {
    icon: "🛡️",
    title: "Moderation",
    body: "Moderators review all submissions before they appear publicly. They may approve, reject, or lightly edit a submission for clarity, formatting, or accuracy. Rejections are not personal — common reasons include no rat on screen, duplicate sighting, or a description that needs more detail. You're welcome to resubmit with improvements.",
  },
  {
    icon: "🚫",
    title: "What will be rejected",
    body: "Submissions will be rejected for: no on-screen rat, duplicate of an existing sighting, hate speech or discriminatory content, spam or promotional content, descriptions that are unintelligible or contain only a single word, and images that are clearly watermarked or from press kits.",
  },
];
