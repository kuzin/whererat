import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submission Guidelines",
  description:
    "Read WhereRat submission guidelines for valid sightings, spoilers, moderation, accessibility, and sources.",
  alternates: {
    canonical: "/guidelines",
  },
};

const guidelines = [
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
    body: "Write descriptions that work for everyone. Describe what is actually visible on screen so that sightings are useful to people who are blind or have low vision. Avoid descriptions that rely purely on visual cues like \"the rat in the bottom left\" without additional context. Sighting titles should be meaningful, not just \"rat scene.\"",
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

export default function GuidelinesPage() {
  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="self-start rounded-2xl border border-amber-500/35 wr-panel-warm p-8">
          <div className="text-4xl leading-none sm:text-5xl">
            <span aria-hidden>📖</span>
          </div>
          <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
            Guidelines
          </h1>
          <p className="mt-5 leading-relaxed text-orange-950 dark:text-amber-50/90">
            Standards for submissions, spoilers, moderation, inclusivity, and accessibility — so the catalog stays accurate, welcoming, and easy to trust.
          </p>
        </aside>

        <section className="grid gap-4">
            {guidelines.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-stone-900/15 bg-white p-5 transition hover:bg-amber-50/50 dark:border-white/12 dark:bg-stone-900/70 dark:hover:bg-amber-950/22"
              >
                <h3 className="wr-display flex items-center gap-2 text-2xl font-bold text-stone-950 dark:text-stone-100">
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.title}</span>
                </h3>
                <p className="mt-3 leading-relaxed text-stone-700 dark:text-stone-300">{item.body}</p>
              </article>
            ))}

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-900/15 bg-amber-50/60 p-5 dark:border-white/12 dark:bg-amber-950/20">
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">Ready to submit a sighting?</p>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">You know the rules — go log that rat.</p>
              </div>
              <a href="/submit" className="wr-btn-primary shrink-0 px-5 py-2.5 text-sm font-bold">
                Submit a sighting →
              </a>
            </div>

            <p className="select-none text-center text-[0.6rem] leading-loose tracking-widest text-stone-300 dark:text-stone-700" aria-hidden="true">
              * rats have seen more films than most critics and charge nothing for their opinions
              · they prefer the middle seat · their tiny claws make no noise during quiet scenes
              · they will eat your popcorn but only the unpopped kernels, out of respect
              · no rat has ever spoiled an ending · they are, frankly, professionals
            </p>
        </section>
      </section>
    </main>
  );
}
